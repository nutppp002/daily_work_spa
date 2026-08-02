import { getSettings, saveSettings, tryMarkNotificationSent } from './settings.js?v=1.1';
import { getProjects } from './projects.js?v=1.1';

let cronInterval = null;

export function startCronJobs() {
    if (cronInterval) clearInterval(cronInterval);
    
    // Check every minute
    cronInterval = setInterval(checkMorningNotify, 60000);
    
    // Check immediately on load after a short delay
    setTimeout(checkMorningNotify, 5000);
}

async function checkMorningNotify() {
    try {
        const settings = await getSettings();
        const notifications = settings.notifications || [];
        if (notifications.length === 0) return;

        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const mins = now.getMinutes().toString().padStart(2, '0');
        const currentTime = `${hours}:${mins}`;
        
        // Use local date for "today"
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        let lastNotifiedDates = settings.last_notified_dates || {};

        // Migrate legacy last notification date if present
        if (settings.last_morning_notify_date && !lastNotifiedDates['default_morning']) {
            lastNotifiedDates['default_morning'] = settings.last_morning_notify_date;
            await saveSettings({ last_notified_dates: lastNotifiedDates });
        }

        const projects = await getProjects();
        // Filter only active projects that have line config
        const activeProjects = projects.filter(p => p.active == 1 && p.line_token && p.line_group_id);

        for (const noti of notifications) {
            const notiId = noti.id;
            if (!notiId || !noti.time || !noti.message) continue;

            // Check if current time is exactly or past the notify time
            if (currentTime >= noti.time) {
                // Check if we locally think it hasn't been sent today
                if (lastNotifiedDates[notiId] !== todayStr) {
                    
                    let canSend = false;
                    try {
                        canSend = await tryMarkNotificationSent(notiId, todayStr);
                    } catch (err) {
                        console.error("[CRON] Failed to mark notification sent, will retry:", err);
                        continue; // ข้ามไปก่อน จะลองใหม่ในรอบถัดไป
                    }

                    if (!canSend) {
                        // Another client already sent it, update local state
                        lastNotifiedDates[notiId] = todayStr;
                        continue;
                    }

                    console.log(`[CRON] Triggering notification ${noti.time}...`);
                    
                    lastNotifiedDates[notiId] = todayStr;

                    for (const proj of activeProjects) {
                        try {
                            const apiUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                                            ? '/daily_work_spa/api/line_bot.php' 
                                            : '/api/line_bot.php';

                            await fetch(apiUrl, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    token: proj.line_token,
                                    to: proj.line_group_id,
                                    message: noti.message
                                })
                            });
                            console.log(`[CRON] Sent notification for project: ${proj.name} at ${noti.time}`);
                        } catch (e) {
                            console.error(`[CRON] Error sending for project ${proj.name}:`, e);
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error("[CRON] Main Error:", error);
    }
}

export async function testNotification(message) {
    try {
        const projects = await getProjects();
        const activeProjects = projects.filter(p => p.active == 1 && p.line_token && p.line_group_id);
        
        if (activeProjects.length === 0) {
            alert('ไม่พบโครงการที่เปิดใช้งาน หรือยังไม่ได้ตั้งค่า LINE Token/Group ID ในเมนูจัดการโครงการ');
            return;
        }

        let successCount = 0;
        let lastError = "";
        for (const proj of activeProjects) {
            try {
                const apiUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                                ? '/daily_work_spa/api/line_bot.php' 
                                : '/api/line_bot.php';

                const res = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        token: proj.line_token,
                        to: proj.line_group_id,
                        message: message || "ทดสอบระบบแจ้งเตือนอัตโนมัติ"
                    })
                });
                
                const responseData = await res.json();
                
                if(res.ok) {
                    successCount++;
                } else {
                    lastError = responseData.error || responseData.message || JSON.stringify(responseData);
                    console.error(`[TEST] Error response from PHP for project ${proj.name}:`, responseData);
                }
            } catch (e) {
                lastError = e.message;
                console.error(`[TEST] Exception sending for project ${proj.name}:`, e);
            }
        }
        
        if(successCount > 0) {
            alert(`ทดสอบส่งข้อความสำเร็จ ${successCount} โครงการ! กรุณาเช็คในกลุ่ม LINE ครับ`);
        } else {
            alert(`ส่งข้อความล้มเหลว!\n\nสาเหตุ: ${lastError}\n\n(เช็คความถูกต้องของ Token, Group ID หรือการตั้งค่าอื่นๆ อีกครั้งครับ)`);
        }
    } catch (error) {
        console.error("[TEST] Main Error:", error);
        alert('เกิดข้อผิดพลาด: ' + error.message);
    }
}
