import { db } from '../firebase-config.js';
import { collection, doc, getDoc, setDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, arrayUnion } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const collName = "summaries";

export async function getSummaries(startDate, endDate) {
    const q = query(collection(db, collName), where("summary_date", ">=", startDate), where("summary_date", "<=", endDate));
    const snapshot = await getDocs(q);
    const list = [];
    snapshot.forEach(d => {
        list.push({ id: d.id, ...d.data() });
    });
    // Sort descending by date
    list.sort((a, b) => {
        if (a.summary_date !== b.summary_date) {
            return b.summary_date.localeCompare(a.summary_date);
        }
        return 0;
    });
    return list;
}

export async function getSummary(memberId, date) {
    const q = query(collection(db, collName), where("member_id", "==", memberId), where("summary_date", "==", date));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }
    return null;
}

export async function saveSummary(data, id = null) {
    let returnId = id;
    if (id) {
        const ref = doc(db, collName, id);
        await updateDoc(ref, {
            ...data,
            updated_at: new Date().toISOString()
        });
    } else {
        const ref = await addDoc(collection(db, collName), {
            ...data,
            updated_at: new Date().toISOString()
        });
        returnId = ref.id;
    }

    // Save history titles
    if (data.member_id && data.items && data.items.length > 0) {
        const titles = data.items.map(i => i.title.trim()).filter(t => t);
        if (titles.length > 0) {
            try {
                const ref = doc(db, "member_task_titles", data.member_id);
                await setDoc(ref, {
                    titles: arrayUnion(...titles)
                }, { merge: true });
            } catch (e) {
                console.error("Failed to save title history", e);
            }
        }
    }

    return returnId;
}

export async function deleteSummary(id) {
    const ref = doc(db, collName, id);
    await deleteDoc(ref);
}

export async function getMemberTaskTitles(memberId) {
    if (!memberId) return [];
    try {
        const d = await getDoc(doc(db, "member_task_titles", memberId));
        if (d.exists()) {
            return d.data().titles || [];
        }
    } catch(e) {
        console.error("Error fetching task titles:", e);
    }
    return [];
}

// Groq AI Integration
const GROQ_API_KEY = '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'; 
const GROQ_MODEL = 'llama-3.1-8b-instant';

export async function aiExpandText(title, detail, projectName = '') {
    let prompt = "";
    if (detail) {
        prompt = `คุณเป็นผู้ช่วยเขียนรายงานสรุปผลการดำเนินงานภาษาไทย สำหรับทีมติดตั้งระบบโรงพยาบาล HOSxP\n`
               + (projectName ? `โครงการ: ${projectName}\n` : "")
               + `หัวข้องาน: ${title}\n`
               + `ข้อความที่มีอยู่แล้ว:\n${detail}\n\n`
               + `กรุณาขยายข้อความข้างต้นให้สมบูรณ์และชัดเจนยิ่งขึ้น โดยรักษาเนื้อหาเดิมทั้งหมดไว้ครบถ้วน และเพิ่มเติมรายละเอียดที่เกี่ยวข้องให้กระชับ เป็นภาษาไทย ตอบเฉพาะเนื้อหาที่ขยายแล้วเท่านั้น ไม่ต้องขึ้นหัวข้อ`;
    } else {
        prompt = `คุณเป็นผู้ช่วยเขียนรายงานสรุปผลการดำเนินงานภาษาไทย สำหรับทีมติดตั้งระบบโรงพยาบาล HOSxP\n`
               + (projectName ? `โครงการ: ${projectName}\n` : "")
               + `หัวข้องาน: ${title}\n\n`
               + `กรุณาเขียนรายละเอียดผลการดำเนินงานของหัวข้อนี้ให้กระชับ ชัดเจน เป็นภาษาไทย ไม่เกิน 3-4 ประโยค ตอบเฉพาะเนื้อหารายละเอียดเท่านั้น ไม่ต้องขึ้นหัวข้อ ไม่ต้องมีหัวข้อซ้ำ`;
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 600,
            temperature: 0.7
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'Failed to call Groq API');
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
}
