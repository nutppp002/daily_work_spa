import { db } from '../firebase-config.js';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const collName = "plans";

export async function getPlans(startDate, endDate) {
    const q = query(collection(db, collName), where("plan_date", ">=", startDate), where("plan_date", "<=", endDate));
    const snapshot = await getDocs(q);
    const list = [];
    snapshot.forEach(d => {
        list.push({ id: d.id, ...d.data() });
    });
    // Sort descending by date, then ascending by created_at (or just return)
    list.sort((a, b) => {
        if (a.plan_date !== b.plan_date) {
            return b.plan_date.localeCompare(a.plan_date); // newer first
        }
        return 0;
    });
    return list;
}

export async function getPlan(memberId, date) {
    // For auto-filling my plan today
    const q = query(collection(db, collName), where("member_id", "==", memberId), where("plan_date", "==", date));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }
    return null;
}

export async function getPlanById(id) {
    const q = query(collection(db, collName), where("__name__", "==", id));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }
    return null;
}

export async function savePlan(data, id = null) {
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

export async function deletePlan(id) {
    const ref = doc(db, collName, id);
    await deleteDoc(ref);
}
