import { db } from '../firebase-config.js';
import { doc, getDoc, setDoc, runTransaction } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

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

export async function tryMarkNotificationSent(notiId, dateStr) {
    try {
        const ref = doc(db, "settings", settingsDocId);
        const result = await runTransaction(db, async (transaction) => {
            const docSnap = await transaction.get(ref);
            if (!docSnap.exists()) {
                // If doc doesn't exist, we can't reliably transact, but we can set it
                transaction.set(ref, { last_notified_dates: { [notiId]: dateStr } }, { merge: true });
                return true;
            }
            
            const data = docSnap.data();
            const lastNotifiedDates = data.last_notified_dates || {};
            
            if (lastNotifiedDates[notiId] === dateStr) {
                // Already sent by another client
                return false;
            }
            
            lastNotifiedDates[notiId] = dateStr;
            transaction.update(ref, { last_notified_dates: lastNotifiedDates });
            return true;
        });
        return result;
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw e;
    }
}
