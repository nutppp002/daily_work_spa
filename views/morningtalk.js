import { getMorningTalks, saveMorningTalk, deleteMorningTalk } from '../services/morningtalk.js';
import { getProjects } from '../services/projects.js';
import { getMembers } from '../services/members.js';

export async function renderMorningTalkView(container, user) {
    const today = new Date().toISOString().split('T')[0];
    
    container.innerHTML = `
        <div class="row">
            <!-- Left Panel: Form -->
            <div class="col-md-4">
                <div class="card p-0 mb-4 border-teal" style="border-top: 4px solid #008080;">
                    <div class="bg-teal text-white p-2 fw-bold" style="background-color: #008080;">
                        <i class="bi bi-chat-square-text"></i> บันทึก Morning Talk
                    </div>
                    <div class="p-3">
                        <form id="mtForm">
                            <input type="hidden" id="mtId" value="">
                            
                            <div class="mb-3">
                                <label class="form-label small text-muted mb-1">วันที่</label>
                                <input type="date" id="mtDate" class="form-control form-control-sm" value="${today}" required>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label small text-muted mb-1">โครงการ</label>
                                <select id="mtProject" class="form-select form-select-sm" required>
                                    <option value="">-- เลือกโครงการ --</option>
                                </select>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label small text-muted mb-1">รายละเอียด</label>
                                <textarea id="mtContent" class="form-control form-control-sm" rows="6" placeholder="บันทึกสิ่งที่พูดคุยใน Morning Talk..." required></textarea>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label small text-muted mb-1">Talk By (ผู้พูด/ผู้นำ Morning Talk)</label>
                                <select id="mtTalkBy" class="form-select form-select-sm" required>
                                    <option value="">-- เลือกผู้พูด --</option>
                                </select>
                            </div>
                            
                            <div class="mb-4">
                                <label class="form-label small text-muted mb-1">ผู้บันทึก</label>
                                <select id="mtRecordedBy" class="form-select form-select-sm" required>
                                    <option value="">-- เลือกผู้บันทึก --</option>
                                </select>
                            </div>
                            
                            <div class="d-flex gap-2">
                                <button type="button" class="btn btn-outline-secondary btn-sm flex-grow-1" id="clearMtBtn">ล้างข้อมูล</button>
                                <button type="submit" class="btn btn-sm text-white flex-grow-1" style="background-color: #008080;" id="saveMtBtn">
                                    [↓] บันทึก Morning Talk
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            
            <!-- Right Panel: List -->
            <div class="col-md-8">
                <div class="card p-0" style="border-top: 4px solid #008080;">
                    <div class="bg-teal text-white p-2 d-flex justify-content-between align-items-center" style="background-color: #008080;">
                        <div class="fw-bold"><i class="bi bi-chat"></i> Morning Talk</div>
                        <div class="d-flex align-items-center gap-2">
                            <span class="small">จาก</span>
                            <input type="date" id="filterStartDate" class="form-control form-control-sm w-auto" value="${today}">
                            <span class="small">ถึง</span>
                            <input type="date" id="filterEndDate" class="form-control form-control-sm w-auto" value="${today}">
                            <button class="btn btn-sm btn-light" id="btnSearch"><i class="bi bi-search"></i></button>
                        </div>
                    </div>
                    <div class="p-4 bg-light min-vh-50" id="mtListContainer">
                        <div class="text-center py-5 text-muted">
                            <i class="bi bi-chat-square text-secondary" style="font-size: 3rem; opacity: 0.5;"></i>
                            <p class="mt-2">กำลังโหลด...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const projectSelect = document.getElementById('mtProject');
    const talkBySelect = document.getElementById('mtTalkBy');
    const recordedBySelect = document.getElementById('mtRecordedBy');
    const listContainer = document.getElementById('mtListContainer');
    
    let projects = [];
    let members = [];
    let allData = [];

    async function loadDropdowns() {
        projects = await getProjects();
        members = await getMembers();

        let projOpts = '<option value="">-- เลือกโครงการ --</option>';
        projects.forEach(p => projOpts += `<option value="${p.id}">${p.name}</option>`);
        projectSelect.innerHTML = projOpts;

        let memOpts = '<option value="">-- เลือก --</option>';
        members.forEach(m => memOpts += `<option value="${m.id}">${m.nickname} (${m.line_name})</option>`);
        
        talkBySelect.innerHTML = memOpts;
        recordedBySelect.innerHTML = memOpts;

        // Default recorded by to current user
        recordedBySelect.value = user.id;
    }

    async function loadList() {
        listContainer.innerHTML = `
            <div class="text-center py-5 text-muted">
                <div class="spinner-border text-teal" style="color: #008080;"></div>
                <p class="mt-2">กำลังโหลดข้อมูล...</p>
            </div>`;
            
        const start = document.getElementById('filterStartDate').value;
        const end = document.getElementById('filterEndDate').value;
        
        try {
            allData = await getMorningTalks(start, end);
            
            if (allData.length === 0) {
                listContainer.innerHTML = `
                    <div class="text-center py-5 text-muted">
                        <i class="bi bi-chat-square text-secondary" style="font-size: 3rem; opacity: 0.5;"></i>
                        <p class="mt-2">ยังไม่มี Morning Talk ในช่วงวันที่ที่เลือก</p>
                    </div>`;
                return;
            }

            let html = '';
            allData.forEach(item => {
                const proj = projects.find(p => p.id === item.project_id) || { name: 'Unknown Project' };
                const talkBy = members.find(m => m.id === item.talk_by) || { nickname: 'Unknown' };
                const recBy = members.find(m => m.id === item.recorded_by) || { nickname: 'Unknown' };
                
                // Formatting date nicely
                const d = new Date(item.talk_date);
                const dateStr = d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

                html += `
                    <div class="card mb-3 shadow-sm border-0">
                        <div class="card-header bg-white d-flex justify-content-between align-items-center">
                            <div>
                                <span class="badge" style="background-color: #008080;">${proj.name}</span>
                                <span class="ms-2 fw-bold text-dark">${dateStr}</span>
                            </div>
                            <div class="dropdown">
                                <button class="btn btn-sm btn-link text-muted" type="button" data-bs-toggle="dropdown"><i class="bi bi-three-dots-vertical"></i></button>
                                <ul class="dropdown-menu dropdown-menu-end">
                                    <li><button class="dropdown-item btn-edit" data-id="${item.id}"><i class="bi bi-pencil me-2"></i>แก้ไข</button></li>
                                    ${user.is_admin || item.recorded_by === user.id ? `<li><button class="dropdown-item text-danger btn-delete" data-id="${item.id}"><i class="bi bi-trash me-2"></i>ลบ</button></li>` : ''}
                                </ul>
                            </div>
                        </div>
                        <div class="card-body">
                            <p style="white-space: pre-wrap;" class="mb-3">${item.content}</p>
                            <hr class="text-muted opacity-25">
                            <div class="d-flex justify-content-between small text-muted">
                                <div><i class="bi bi-person-video3"></i> ผู้พูด: <span class="fw-bold">${talkBy.nickname}</span></div>
                                <div><i class="bi bi-pencil-square"></i> ผู้บันทึก: ${recBy.nickname}</div>
                            </div>
                        </div>
                    </div>
                `;
            });
            listContainer.innerHTML = html;

            // Attach events
            listContainer.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.closest('button').dataset.id;
                    const item = allData.find(x => x.id === id);
                    if(item) {
                        document.getElementById('mtId').value = item.id;
                        document.getElementById('mtDate').value = item.talk_date;
                        document.getElementById('mtProject').value = item.project_id;
                        document.getElementById('mtContent').value = item.content;
                        document.getElementById('mtTalkBy').value = item.talk_by;
                        document.getElementById('mtRecordedBy').value = item.recorded_by;
                    }
                });
            });

            listContainer.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.target.closest('button').dataset.id;
                    if(confirm("ยืนยันการลบข้อมูล Morning Talk นี้?")) {
                        try {
                            await deleteMorningTalk(id);
                            loadList();
                        } catch(err) {
                            alert('Error: ' + err.message);
                        }
                    }
                });
            });

        } catch (e) {
            listContainer.innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`;
        }
    }

    document.getElementById('clearMtBtn').addEventListener('click', () => {
        document.getElementById('mtForm').reset();
        document.getElementById('mtId').value = '';
        document.getElementById('mtDate').value = today;
        document.getElementById('mtRecordedBy').value = user.id;
    });

    document.getElementById('mtForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('saveMtBtn');
        btn.disabled = true;
        btn.innerHTML = 'กำลังบันทึก...';

        const id = document.getElementById('mtId').value;
        const data = {
            talk_date: document.getElementById('mtDate').value,
            project_id: document.getElementById('mtProject').value,
            content: document.getElementById('mtContent').value.trim(),
            talk_by: document.getElementById('mtTalkBy').value,
            recorded_by: document.getElementById('mtRecordedBy').value
        };

        try {
            await saveMorningTalk(data, id ? id : null);
            document.getElementById('clearMtBtn').click(); // reset form
            loadList();
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '[↓] บันทึก Morning Talk';
        }
    });

    document.getElementById('btnSearch').addEventListener('click', loadList);

    // Bootstrap init
    await loadDropdowns();
    await loadList();
}
