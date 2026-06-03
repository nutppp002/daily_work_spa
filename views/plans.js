import { getPlans, savePlan, deletePlan } from '../services/plans.js';
import { getProjects } from '../services/projects.js';
import { getMembers } from '../services/members.js';

export async function renderPlansView(container, user) {
    const today = new Date().toISOString().split('T')[0];
    
    // Category config matching UI
    const catConfig = [
        { id: 'cat_assigned', name: 'งานรับมอบหมาย', color: '#0d6efd', icon: 'bi-briefcase' },
        { id: 'cat_pending', name: 'งานค้างต่อจากเมื่อวันก่อน', color: '#fd7e14', icon: 'bi-arrow-repeat' },
        { id: 'cat_urgent', name: 'งานเร่งด่วน (งานใหม่รับในวัน)', color: '#dc3545', icon: 'bi-lightning-charge' },
        { id: 'cat_others', name: 'งานอื่น ๆ', color: '#6c757d', icon: 'bi-three-dots' }
    ];

    let catBlocksHtml = '';
    catConfig.forEach(cat => {
        catBlocksHtml += `
            <div class="mb-3">
                <div class="fw-bold small mb-1" style="color: ${cat.color};"><i class="bi ${cat.icon} me-1"></i> ${cat.name}</div>
                <div id="container_${cat.id}"></div>
                <button type="button" class="btn btn-sm w-100 btn-add-task" data-cat="${cat.name}" data-catid="${cat.id}" 
                        style="border: 1px dashed ${cat.color}; color: ${cat.color}; background-color: transparent;">
                    + เพิ่มรายการ
                </button>
            </div>
        `;
    });

    container.innerHTML = `
        <div class="row">
            <!-- Left Panel: Form -->
            <div class="col-md-6 col-lg-5 col-xl-5">
                <div class="card p-0 mb-4 border-primary" style="border-top: 4px solid #0d6efd;">
                    <div class="bg-primary text-white p-2 fw-bold">
                        <i class="bi bi-person-workspace"></i> บันทึกแผนงานเช้า
                    </div>
                    <div class="p-3">
                        <form id="planForm">
                            <input type="hidden" id="planId" value="">
                            
                            <div class="mb-3">
                                <label class="form-label small text-muted mb-1">วันที่</label>
                                <input type="date" id="planDate" class="form-control" value="${today}" required>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label small text-muted mb-1">โครงการ</label>
                                <select id="planProject" class="form-select" required>
                                    <option value="">-- เลือกโครงการ --</option>
                                </select>
                            </div>
                            
                            <div class="mb-4">
                                <label class="form-label small text-muted mb-1">สมาชิก</label>
                                <select id="planMember" class="form-select" required>
                                    <option value="">-- เลือกสมาชิก --</option>
                                </select>
                            </div>
                            
                            ${catBlocksHtml}
                            
                            <div class="d-flex gap-2 mt-4">
                                <button type="button" class="btn btn-outline-secondary flex-grow-1" id="clearPlanBtn">ล้างฟอร์ม</button>
                                <button type="submit" class="btn btn-primary flex-grow-1" id="savePlanBtn">
                                    [↓] บันทึกแผนงาน
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            
            <!-- Right Panel: List -->
            <div class="col-md-6 col-lg-7 col-xl-7">
                <div class="card p-0" style="border-top: 4px solid #0d6efd;">
                    <div class="bg-primary text-white p-2 d-flex justify-content-between align-items-center">
                        <div class="fw-bold"><i class="bi bi-list-task"></i> แผนงานเช้า</div>
                        <div class="d-flex align-items-center gap-2">
                            <span class="small">จาก</span>
                            <input type="date" id="filterStartDate" class="form-control form-control-sm w-auto" value="${today}">
                            <span class="small">ถึง</span>
                            <input type="date" id="filterEndDate" class="form-control form-control-sm w-auto" value="${today}">
                            <button class="btn btn-sm btn-light" id="btnSearch"><i class="bi bi-search"></i></button>
                        </div>
                    </div>
                    <div class="p-4 bg-light min-vh-50" id="planListContainer">
                        <div class="text-center py-5 text-muted">
                            <i class="bi bi-inbox text-secondary" style="font-size: 3rem; opacity: 0.5;"></i>
                            <p class="mt-2">กำลังโหลด...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const projectSelect = document.getElementById('planProject');
    const memberSelect = document.getElementById('planMember');
    const listContainer = document.getElementById('planListContainer');
    
    let projects = [];
    let members = [];
    let allData = [];

    function createTaskInput(catId, catName, text = '') {
        const div = document.createElement('div');
        div.className = 'input-group input-group-sm mb-2 task-item';
        div.dataset.cat = catName;
        div.innerHTML = `
            <input type="text" class="form-control task-text" placeholder="ระบุงาน..." value="${text}" required>
            <button class="btn btn-outline-danger btn-remove-task" type="button" tabindex="-1"><i class="bi bi-x"></i></button>
        `;
        div.querySelector('.btn-remove-task').addEventListener('click', () => div.remove());
        return div;
    }

    // Attach add task events
    document.querySelectorAll('.btn-add-task').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const catId = e.target.dataset.catid;
            const catName = e.target.dataset.cat;
            document.getElementById('container_' + catId).appendChild(createTaskInput(catId, catName));
        });
    });

    async function loadDropdowns() {
        projects = await getProjects();
        members = await getMembers();

        let projOpts = '<option value="">-- เลือกโครงการ --</option>';
        projects.forEach(p => projOpts += `<option value="${p.id}">${p.name}</option>`);
        projectSelect.innerHTML = projOpts;

        let memOpts = '<option value="">-- เลือกสมาชิก --</option>';
        members.forEach(m => memOpts += `<option value="${m.id}">${m.nickname} (${m.line_name})</option>`);
        memberSelect.innerHTML = memOpts;

        // Default member to current user
        memberSelect.value = user.id;
    }

    function renderTasksListHTML(tasks) {
        if (!tasks || tasks.length === 0) return '<p class="small text-muted mb-0">ไม่มีรายการงาน</p>';
        
        let html = '';
        catConfig.forEach(cat => {
            const catTasks = tasks.filter(t => t.category === cat.name);
            if (catTasks.length > 0) {
                html += `<div class="mb-2"><span class="small fw-bold" style="color:${cat.color}">${cat.name}</span><ul class="mb-0 ps-3">`;
                catTasks.forEach(t => {
                    html += `<li class="small">${t.text}</li>`;
                });
                html += `</ul></div>`;
            }
        });
        return html;
    }

    async function loadList() {
        listContainer.innerHTML = `
            <div class="text-center py-5 text-muted">
                <div class="spinner-border text-primary"></div>
                <p class="mt-2">กำลังโหลดข้อมูล...</p>
            </div>`;
            
        const start = document.getElementById('filterStartDate').value;
        const end = document.getElementById('filterEndDate').value;
        
        try {
            allData = await getPlans(start, end);
            
            if (allData.length === 0) {
                listContainer.innerHTML = `
                    <div class="text-center py-5 text-muted">
                        <i class="bi bi-inbox text-secondary" style="font-size: 3rem; opacity: 0.5;"></i>
                        <p class="mt-2">ยังไม่มีแผนงานในช่วงวันที่ที่เลือก</p>
                    </div>`;
                return;
            }

            let html = '';
            // Sort by date desc, then sort_order of members
            const enrichedData = allData.map(item => {
                const proj = projects.find(p => p.id === item.project_id) || { name: 'Unknown Project' };
                const mem = members.find(m => m.id === item.member_id) || { nickname: 'Unknown', color: '#ccc', sort_order: 999 };
                return { ...item, proj, mem };
            }).sort((a, b) => {
                if(a.talk_date !== b.talk_date) return b.talk_date?.localeCompare(a.talk_date);
                return a.mem.sort_order - b.mem.sort_order;
            });

            enrichedData.forEach(item => {
                const d = new Date(item.plan_date);
                const dateStr = d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

                html += `
                    <div class="card mb-3 shadow-sm border-0" style="border-left: 4px solid ${item.mem.color} !important;">
                        <div class="card-header bg-white d-flex justify-content-between align-items-center">
                            <div>
                                <span class="fw-bold"><i class="bi bi-person-circle"></i> ${item.mem.nickname}</span>
                                <span class="badge bg-light text-dark ms-2 border"><i class="bi bi-folder2"></i> ${item.proj.name}</span>
                                <span class="ms-2 small text-muted">${dateStr}</span>
                            </div>
                            <div class="dropdown">
                                <button class="btn btn-sm btn-link text-muted" type="button" data-bs-toggle="dropdown"><i class="bi bi-three-dots-vertical"></i></button>
                                <ul class="dropdown-menu dropdown-menu-end">
                                    <li><button class="dropdown-item btn-edit" data-id="${item.id}"><i class="bi bi-pencil me-2"></i>แก้ไข</button></li>
                                    ${user.is_admin || item.member_id === user.id ? `<li><button class="dropdown-item text-danger btn-delete" data-id="${item.id}"><i class="bi bi-trash me-2"></i>ลบ</button></li>` : ''}
                                </ul>
                            </div>
                        </div>
                        <div class="card-body">
                            ${renderTasksListHTML(item.tasks)}
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
                        document.getElementById('planId').value = item.id;
                        document.getElementById('planDate').value = item.plan_date;
                        document.getElementById('planProject').value = item.project_id;
                        document.getElementById('planMember').value = item.member_id;
                        
                        // Clear existing
                        catConfig.forEach(cat => {
                            document.getElementById('container_' + cat.id).innerHTML = '';
                        });

                        // Populate tasks
                        if(item.tasks) {
                            item.tasks.forEach(t => {
                                const catObj = catConfig.find(c => c.name === t.category);
                                if(catObj) {
                                    document.getElementById('container_' + catObj.id).appendChild(createTaskInput(catObj.id, t.category, t.text));
                                }
                            });
                        }
                    }
                });
            });

            listContainer.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.target.closest('button').dataset.id;
                    if(confirm("ยืนยันการลบข้อมูลแผนงานนี้?")) {
                        try {
                            await deletePlan(id);
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

    document.getElementById('clearPlanBtn').addEventListener('click', () => {
        document.getElementById('planForm').reset();
        document.getElementById('planId').value = '';
        document.getElementById('planDate').value = today;
        document.getElementById('planMember').value = user.id;
        
        catConfig.forEach(cat => {
            document.getElementById('container_' + cat.id).innerHTML = '';
        });
    });

    document.getElementById('planForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('savePlanBtn');
        btn.disabled = true;
        btn.innerHTML = 'กำลังบันทึก...';

        const id = document.getElementById('planId').value;
        const tasks = [];
        
        document.querySelectorAll('.task-item').forEach(item => {
            const cat = item.dataset.cat;
            const text = item.querySelector('.task-text').value.trim();
            if(text) {
                tasks.push({ category: cat, text });
            }
        });

        const data = {
            plan_date: document.getElementById('planDate').value,
            project_id: document.getElementById('planProject').value,
            member_id: document.getElementById('planMember').value,
            report_time: new Date().toLocaleTimeString('th-TH'),
            tasks: tasks
        };

        try {
            await savePlan(data, id ? id : null);
            document.getElementById('clearPlanBtn').click(); // reset form
            loadList();
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '[↓] บันทึกแผนงาน';
        }
    });

    document.getElementById('btnSearch').addEventListener('click', loadList);

    // Bootstrap init
    await loadDropdowns();
    await loadList();
}
