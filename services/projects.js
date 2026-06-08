import { db } from '../firebase-config.js';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const collName = "projects";

export async function getProjects() {
    const q = query(collection(db, collName));
    const snapshot = await getDocs(q);
    const list = [];
    snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort client-side: sort_order ASC, then name ASC
    list.sort((a, b) => {
        if (a.sort_order === b.sort_order) {
            return (a.name || '').localeCompare(b.name || '');
        }
        return a.sort_order - b.sort_order;
    });
    return list;
}

export async function addProject(data) {
    const ref = await addDoc(collection(db, collName), {
        name: data.name || '',
        hospital: data.hospital || '',
        color: data.color || '#1a73e8',
        sort_order: parseInt(data.sort_order || '0'),
        active: parseInt(data.active || '1'),
        line_token: data.line_token || '',
        line_group_id: data.line_group_id || ''
    });
    return ref.id;
}

export async function updateProject(id, data) {
    const ref = doc(db, collName, id);
    await updateDoc(ref, {
        name: data.name || '',
        hospital: data.hospital || '',
        color: data.color || '#1a73e8',
        sort_order: parseInt(data.sort_order || '0'),
        active: parseInt(data.active || '1'),
        line_token: data.line_token || '',
        line_group_id: data.line_group_id || ''
    });
}

export async function deleteProject(id) {
    const ref = doc(db, collName, id);
    await deleteDoc(ref);
}
