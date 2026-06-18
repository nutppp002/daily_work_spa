import { getSettings, saveSettings } from '../services/settings.js?v=1.1';

export async function renderSettingsView(container, user) {
    if (!user.is_admin) {
        container.innerHTML = `<div class="alert alert-danger m-4">ไม่มีสิทธิ์เข้าถึงหน้านี้</div>`;
        return;
    }

    let notifications = [];

    container.innerHTML = `
        <div class="row mb-3 align-items-center">
            <div class="col">
                <h4 class="fw-bold mb-0 text-dark"><i class="bi bi-gear text-primary me-2"></i>ตั้งค่าระบบ</h4>
            </div>
        </div>

        <div class="card shadow-sm border-0 rounded-4">
            <div class="card-body p-4">
                <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-4">
                    <h5 class="card-title fw-bold mb-0"><i class="bi bi-bell me-2"></i>การแจ้งเตือน Line Group อัตโนมัติ</h5>
                    <button type="button" class="btn btn-sm btn-success" id="addNotiBtn">
                        <i class="bi bi-plus-circle me-1"></i>เพิ่มเวลาแจ้งเตือน
                    </button>
                </div>
                
                <div id="settingsAlert"></div>

                <form id="settingsForm">
                    <div id="notificationsList"></div>

                    <div class="d-flex justify-content-end mt-4">
                        <button type="submit" class="btn btn-primary fw-bold px-4" id="saveSettingsBtn">
                            <i class="bi bi-save me-2"></i>บันทึกการตั้งค่า
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    function renderNotifications() {
        const listDiv = document.getElementById('notificationsList');
        listDiv.innerHTML = '';
        
        if (notifications.length === 0) {
            listDiv.innerHTML = '<div class="alert alert-info py-2 small">ไม่มีการแจ้งเตือน กดปุ่ม "เพิ่มเวลาแจ้งเตือน" เพื่อสร้างใหม่</div>';
            return;
        }

        notifications.forEach((noti, index) => {
            listDiv.innerHTML += `
                <div class="card mb-3 border">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 class="card-subtitle text-muted fw-bold">การแจ้งเตือน #${index + 1}</h6>
                            <button type="button" class="btn btn-sm btn-outline-danger remove-noti-btn" data-index="${index}">
                                <i class="bi bi-trash"></i> ลบ
                            </button>
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-3">
                                <label class="form-label fw-bold">เวลาที่จะส่งข้อความ</label>
                                <input type="time" class="form-control noti-time" value="${noti.time}" required>
                            </div>
                        </div>
                        <div class="mb-2">
                            <label class="form-label fw-bold">ข้อความแจ้งเตือน</label>
                            <textarea class="form-control noti-message" rows="3" required placeholder="ข้อความที่ต้องการส่ง...">${noti.message}</textarea>
                        </div>
                    </div>
                </div>
            `;
        });
        
        document.querySelectorAll('.remove-noti-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.currentTarget.getAttribute('data-index');
                notifications.splice(idx, 1);
                renderNotifications();
            });
        });
        
        document.querySelectorAll('.noti-time').forEach((input, index) => {
            input.addEventListener('change', e => notifications[index].time = e.target.value);
        });
        document.querySelectorAll('.noti-message').forEach((input, index) => {
            input.addEventListener('change', e => notifications[index].message = e.target.value);
        });
    }

    // Load existing settings
    try {
        const settings = await getSettings();
        notifications = settings.notifications || [];
        renderNotifications();
    } catch (error) {
        console.error("Error loading settings:", error);
    }

    document.getElementById('addNotiBtn').addEventListener('click', () => {
        notifications.push({ id: Date.now().toString() + Math.random().toString(36).substr(2, 5), time: '08:00', message: '' });
        renderNotifications();
    });

    // Handle form submit
    document.getElementById('settingsForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('saveSettingsBtn');
        const alertDiv = document.getElementById('settingsAlert');
        
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>กำลังบันทึก...';
        alertDiv.innerHTML = '';

        try {
            await saveSettings({ notifications });
            alertDiv.innerHTML = `<div class="alert alert-success py-2 small mb-3"><i class="bi bi-check-circle-fill me-2"></i>บันทึกการตั้งค่าเรียบร้อยแล้ว</div>`;
        } catch (error) {
            console.error("Error saving settings:", error);
            alertDiv.innerHTML = `<div class="alert alert-danger py-2 small mb-3"><i class="bi bi-exclamation-triangle-fill me-2"></i>เกิดข้อผิดพลาดในการบันทึก: ${error.message}</div>`;
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-save me-2"></i>บันทึกการตั้งค่า';
            
            setTimeout(() => {
                if (alertDiv.innerHTML.includes('alert-success')) {
                    alertDiv.innerHTML = '';
                }
            }, 3000);
        }
    });
}
