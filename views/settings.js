import { getSettings, saveSettings } from '../services/settings.js?v=1.1';

export async function renderSettingsView(container, user) {
    if (!user.is_admin) {
        container.innerHTML = `<div class="alert alert-danger m-4">ไม่มีสิทธิ์เข้าถึงหน้านี้</div>`;
        return;
    }

    container.innerHTML = `
        <div class="row mb-3 align-items-center">
            <div class="col">
                <h4 class="fw-bold mb-0 text-dark"><i class="bi bi-gear text-primary me-2"></i>ตั้งค่าระบบ</h4>
            </div>
        </div>

        <div class="card shadow-sm border-0 rounded-4">
            <div class="card-body p-4">
                <h5 class="card-title fw-bold border-bottom pb-2 mb-4"><i class="bi bi-bell me-2"></i>การแจ้งเตือน Line Group ตอนเช้า</h5>
                
                <div id="settingsAlert"></div>

                <form id="settingsForm">
                    <div class="row mb-3">
                        <div class="col-md-3">
                            <label class="form-label fw-bold">เวลาที่จะส่งข้อความ</label>
                            <input type="time" id="setting_morning_time" class="form-control" required>
                            <div class="form-text">ระบุเวลาที่ต้องการให้ระบบส่งข้อความอัตโนมัติ</div>
                        </div>
                    </div>
                    
                    <div class="mb-4">
                        <label class="form-label fw-bold">ข้อความแจ้งเตือน</label>
                        <textarea id="setting_morning_message" class="form-control" rows="4" required placeholder="ตัวอย่าง: อรุณสวัสดิ์ครับ ทีมงานทุกท่าน รบกวนแจ้งแผนงานเช้านี้ด้วยครับ"></textarea>
                    </div>

                    <div class="d-flex justify-content-end">
                        <button type="submit" class="btn btn-primary fw-bold px-4" id="saveSettingsBtn">
                            <i class="bi bi-save me-2"></i>บันทึกการตั้งค่า
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Load existing settings
    try {
        const settings = await getSettings();
        document.getElementById('setting_morning_time').value = settings.morning_notify_time || '08:30';
        document.getElementById('setting_morning_message').value = settings.morning_notify_message || '';
    } catch (error) {
        console.error("Error loading settings:", error);
    }

    // Handle form submit
    document.getElementById('settingsForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('saveSettingsBtn');
        const alertDiv = document.getElementById('settingsAlert');
        
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>กำลังบันทึก...';
        alertDiv.innerHTML = '';

        const data = {
            morning_notify_time: document.getElementById('setting_morning_time').value,
            morning_notify_message: document.getElementById('setting_morning_message').value
        };

        try {
            await saveSettings(data);
            alertDiv.innerHTML = `<div class="alert alert-success py-2 small mb-3"><i class="bi bi-check-circle-fill me-2"></i>บันทึกการตั้งค่าเรียบร้อยแล้ว</div>`;
        } catch (error) {
            console.error("Error saving settings:", error);
            alertDiv.innerHTML = `<div class="alert alert-danger py-2 small mb-3"><i class="bi bi-exclamation-triangle-fill me-2"></i>เกิดข้อผิดพลาดในการบันทึก: ${error.message}</div>`;
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-save me-2"></i>บันทึกการตั้งค่า';
            
            // Auto hide success alert after 3 seconds
            setTimeout(() => {
                if (alertDiv.innerHTML.includes('alert-success')) {
                    alertDiv.innerHTML = '';
                }
            }, 3000);
        }
    });
}
