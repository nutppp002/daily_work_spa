import { getSettings, saveSettings } from './settings.js?v=1.1';
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
        let needsSave = false;

        // Migrate legacy last notification date if present
        if (settings.last_morning_notify_date && !lastNotifiedDates['default_morning']) {
            lastNotifiedDates['default_morning'] = settings.last_morning_notify_date;
        }

        const projects = await getProjects();
        // Filter only active projects that have line config
        const activeProjects = projects.filter(p => p.active == 1 && p.line_token && p.line_group_id);

        for (const noti of notifications) {
            const notiId = noti.id;
            if (!notiId || !noti.time || !noti.message) continue;

            // Check if current time is exactly or past the notify time
            if (currentTime >= noti.time) {
                // Check if we already sent it today
                if (lastNotifiedDates[notiId] !== todayStr) {
                    console.log(`[CRON] Triggering notification ${noti.time}...`);
                    
                    lastNotifiedDates[notiId] = todayStr;
                    needsSave = true;

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

        if (needsSave) {
            await saveSettings({ last_notified_dates: lastNotifiedDates });
        }
    } catch (error) {
        console.error("[CRON] Main Error:", error);
    }
}
