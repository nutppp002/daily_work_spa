import { db } from '../firebase-config.js';
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const settingsDocId = "system_settings";

export async function getSettings() {
    const ref = doc(db, "settings", settingsDocId);
    const snapshot = await getDoc(ref);
    if (snapshot.exists()) {
        const data = snapshot.data();
        // Migrate old format to new format
        if (!data.notifications && data.morning_notify_time) {
            data.notifications = [{
                id: 'default_morning',
                time: data.morning_notify_time,
                message: data.morning_notify_message || ''
            }];
        }
        if (!data.notifications) {
            data.notifications = [];
        }
        return data;
    }
    // Default settings
    return {
        notifications: [{
            id: Date.now().toString(),
            time: '08:30',
            message: 'อรุณสวัสดิ์ครับ ทีมงานทุกท่าน รบกวนแจ้งแผนงานเช้านี้ด้วยครับ'
        }],
        last_notified_dates: {}
    };
}

export async function saveSettings(data) {
    const ref = doc(db, "settings", settingsDocId);
    await setDoc(ref, data, { merge: true });
}
