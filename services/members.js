import { db } from '../firebase-config.js';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const collName = "members";

// We need this to hash password for new members
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function getMembers(projectId = null) {
    let q;
    if (projectId) {
        q = query(collection(db, collName), where("project_id", "==", projectId));
    } else {
        q = query(collection(db, collName));
    }
    
    const snapshot = await getDocs(q);
    const list = [];
    snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort client-side: sort_order ASC, then nickname ASC
    list.sort((a, b) => {
        if (a.sort_order === b.sort_order) {
            return (a.nickname || '').localeCompare(b.nickname || '');
        }
        return a.sort_order - b.sort_order;
    });
    return list;
}

export async function addMember(data) {
    const hashed = data.password ? await hashPassword(data.password) : await hashPassword('1234');
    
    const ref = await addDoc(collection(db, collName), {
        project_id: data.project_id || '',
        line_name: data.line_name || '',
        nickname: data.nickname || '',
        username: data.username || data.nickname,
        password_hash: hashed,
        color: data.color || '#1a73e8',
        site_team: data.site_team || '',
        sort_order: parseInt(data.sort_order || '0'),
        active: parseInt(data.active || '1'),
        is_admin: parseInt(data.is_admin || '0')
    });
    return ref.id;
}

export async function updateMember(id, data) {
    const ref = doc(db, collName, id);
    const updates = {
        project_id: data.project_id || '',
        line_name: data.line_name || '',
        nickname: data.nickname || '',
        username: data.username || '',
        color: data.color || '#1a73e8',
        site_team: data.site_team || '',
        sort_order: parseInt(data.sort_order || '0'),
        active: parseInt(data.active || '1'),
        is_admin: parseInt(data.is_admin || '0')
    };

    if (data.password && data.password.trim() !== '') {
        updates.password_hash = await hashPassword(data.password);
    }

    await updateDoc(ref, updates);
}

export async function deleteMember(id) {
    const ref = doc(db, collName, id);
    await deleteDoc(ref);
}
