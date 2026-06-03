import { getMembers, addMember, updateMember, deleteMember } from '../services/members.js';
import { getProjects } from '../services/projects.js';

export async function renderMembersView(container, user) {
    if (!user.is_admin) {
        container.innerHTML = `<div class="alert alert-danger m-4">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</div>`;
        return;
    }

    container.innerHTML = `
        <h3 class="mb-4"><i class="bi bi-people text-primary"></i> จัดการสมาชิก</h3>
        
        <div class="card p-3 mb-4">
            <form id="addMemberForm" class="row g-3 align-items-end">
                <div class="col-md-3">
                    <label class="form-label">ชื่อเล่น (Login ID)</label>
                    <input type="text" id="mem_nickname" class="form-control form-control-sm" required>
                </div>
                <div class="col-md-3">
                    <label class="form-label">ชื่อ-นามสกุล</label>
                    <input type="text" id="mem_fullname" class="form-control form-control-sm">
                </div>
                <div class="col-md-2">
                    <label class="form-label">โครงการ</label>
                    <select id="mem_project" class="form-select form-select-sm">
                        <option value="">-- ไม่ระบุ --</option>
                    </select>
                </div>
                <div class="col-md-1">
                    <label class="form-label">สี</label>
                    <input type="color" id="mem_color" class="form-control form-control-color form-control-sm w-100" value="#1a73e8">
                </div>
                <div class="col-md-1">
                    <label class="form-label">Admin</label>
                    <select id="mem_admin" class="form-select form-select-sm">
                        <option value="0">ไม่ใช่</option>
                        <option value="1">ใช่</option>
                    </select>
                </div>
                <div class="col-md-2">
                    <button type="submit" class="btn btn-primary btn-sm w-100"><i class="bi bi-person-plus"></i> เพิ่มสมาชิก</button>
                </div>
            </form>
        </div>

        <div class="card p-0">
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0 text-nowrap">
                    <thead class="table-light">
                        <tr>
                            <th>ลำดับ</th>
                            <th>สี</th>
                            <th>ชื่อ (Login)</th>
                            <th>ชื่อจริง</th>
                            <th>โครงการประจำ</th>
                            <th>สิทธิ์</th>
                            <th>จัดการ</th>
                        </tr>
                    </thead>
                    <tbody id="membersTableBody">
                        <tr><td colspan="7" class="text-center py-4"><span class="spinner-border spinner-border-sm text-primary"></span> กำลังโหลดข้อมูล...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    const tbody = document.getElementById('membersTableBody');
    const projectSelect = document.getElementById('mem_project');
    
    let membersData = [];
    let projectsData = [];

    async function loadData() {
        try {
            // Load projects for dropdown and mapping
            projectsData = await getProjects();
            
            // Populate dropdown
            projectSelect.innerHTML = '<option value="">-- ไม่ระบุ --</option>';
            projectsData.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = p.name;
                projectSelect.appendChild(opt);
            });

            // Load members
            membersData = await getMembers();
            renderTable();
        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-danger">Error: ${e.message}</td></tr>`;
        }
    }

    function renderTable() {
        if (membersData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-3">ยังไม่มีข้อมูลสมาชิก</td></tr>`;
            return;
        }

        let html = '';
        membersData.forEach(m => {
            const proj = projectsData.find(p => p.id === m.project_id);
            const projName = proj ? proj.name : '<span class="text-muted">-</span>';
            const adminBadge = m.is_admin ? '<span class="badge bg-danger">Admin</span>' : '<span class="badge bg-secondary">User</span>';
            
            html += `
                <tr>
                    <td>${m.sort_order}</td>
                    <td><div style="width:20px;height:20px;border-radius:4px;background-color:${m.color}"></div></td>
                    <td class="fw-bold">${m.nickname}</td>
                    <td>${m.line_name}</td>
                    <td>${projName}</td>
                    <td>${adminBadge}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${m.id}"><i class="bi bi-trash"></i> ลบ</button>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html;

        // Attach delete events
        tbody.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.closest('button').dataset.id;
                if (confirm('คุณต้องการลบสมาชิกคนนี้ใช่หรือไม่?')) {
                    try {
                        await deleteMember(id);
                        loadData(); // reload
                    } catch (err) {
                        alert('Error: ' + err.message);
                    }
                }
            });
        });
    }

    document.getElementById('addMemberForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        btn.disabled = true;
        
        try {
            await addMember({
                nickname: document.getElementById('mem_nickname').value,
                line_name: document.getElementById('mem_fullname').value,
                project_id: document.getElementById('mem_project').value,
                color: document.getElementById('mem_color').value,
                is_admin: document.getElementById('mem_admin').value,
                sort_order: membersData.length + 1,
                active: 1
            });
            e.target.reset();
            document.getElementById('mem_color').value = '#1a73e8';
            await loadData();
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            btn.disabled = false;
        }
    });

    // Initial load
    loadData();
}
