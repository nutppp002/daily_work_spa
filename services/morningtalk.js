import { db } from '../firebase-config.js';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const collName = "morningtalk";

export async function getMorningTalks(startDate, endDate) {
    // If we want a range, we can just fetch all or filter by date client-side to avoid complex indexes for now
    const q = query(collection(db, collName), where("talk_date", ">=", startDate), where("talk_date", "<=", endDate));
    const snapshot = await getDocs(q);
    const list = [];
    snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
    });
    // Sort descending by date, then by updated_at
    list.sort((a, b) => {
        if (a.talk_date !== b.talk_date) {
            return b.talk_date.localeCompare(a.talk_date); // newer first
        }
        return (b.updated_at || '').localeCompare(a.updated_at || '');
    });
    return list;
}

export async function saveMorningTalk(data, id = null) {
    if (id) {
        const ref = doc(db, collName, id);
        await updateDoc(ref, {
            ...data,
            updated_at: new Date().toISOString()
        });
        return id;
    } else {
        const ref = await addDoc(collection(db, collName), {
            ...data,
            updated_at: new Date().toISOString()
        });
        return ref.id;
    }
}

export async function deleteMorningTalk(id) {
    const ref = doc(db, collName, id);
    await deleteDoc(ref);
}
