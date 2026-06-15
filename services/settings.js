import { db } from '../firebase-config.js';
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const settingsDocId = "system_settings";

export async function getSettings() {
    const ref = doc(db, "settings", settingsDocId);
    const snapshot = await getDoc(ref);
    if (snapshot.exists()) {
        return snapshot.data();
    }
    // Default settings
    return {
        morning_notify_time: '08:30',
        morning_notify_message: 'อรุณสวัสดิ์ครับ ทีมงานทุกท่าน รบกวนแจ้งแผนงานเช้านี้ด้วยครับ'
    };
}

export async function saveSettings(data) {
    const ref = doc(db, "settings", settingsDocId);
    await setDoc(ref, {
        morning_notify_time: data.morning_notify_time || '',
        morning_notify_message: data.morning_notify_message || ''
    }, { merge: true });
}
