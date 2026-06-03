import { getProjects, addProject, updateProject, deleteProject } from '../services/projects.js';

export async function renderProjectsView(container, user) {
    if (!user.is_admin) {
        container.innerHTML = `<div class="alert alert-danger m-4">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</div>`;
        return;
    }

    container.innerHTML = `
        <h3 class="mb-4"><i class="bi bi-folder2 text-primary"></i> จัดการโครงการ</h3>
        
        <div class="card p-3 mb-4">
            <form id="addProjectForm" class="row g-3 align-items-end">
                <div class="col-md-3">
                    <label class="form-label">ชื่อโครงการ</label>
                    <input type="text" id="proj_name" class="form-control form-control-sm" required>
                </div>
                <div class="col-md-3">
                    <label class="form-label">โรงพยาบาล/สถานที่</label>
                    <input type="text" id="proj_hospital" class="form-control form-control-sm">
                </div>
                <div class="col-md-2">
                    <label class="form-label">สีประจำโครงการ</label>
                    <input type="color" id="proj_color" class="form-control form-control-color form-control-sm w-100" value="#1a73e8">
                </div>
                <div class="col-md-2">
                    <label class="form-label">ลำดับ</label>
                    <input type="number" id="proj_sort" class="form-control form-control-sm" value="1">
                </div>
                <div class="col-md-2">
                    <button type="submit" class="btn btn-primary btn-sm w-100"><i class="bi bi-plus-circle"></i> เพิ่มโครงการ</button>
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
                            <th>ชื่อโครงการ</th>
                            <th>สถานที่</th>
                            <th>สถานะ</th>
                            <th>จัดการ</th>
                        </tr>
                    </thead>
                    <tbody id="projectsTableBody">
                        <tr><td colspan="6" class="text-center py-4"><span class="spinner-border spinner-border-sm text-primary"></span> กำลังโหลดข้อมูล...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    const tbody = document.getElementById('projectsTableBody');
    let projectsData = [];

    async function loadData() {
        try {
            projectsData = await getProjects();
            renderTable();
        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-danger">Error: ${e.message}</td></tr>`;
        }
    }

    function renderTable() {
        if (projectsData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-3">ยังไม่มีข้อมูลโครงการ</td></tr>`;
            return;
        }

        let html = '';
        projectsData.forEach(p => {
            html += `
                <tr>
                    <td>${p.sort_order}</td>
                    <td><div style="width:20px;height:20px;border-radius:4px;background-color:${p.color}"></div></td>
                    <td class="fw-bold">${p.name}</td>
                    <td>${p.hospital}</td>
                    <td>
                        <span class="badge ${p.active ? 'bg-success' : 'bg-secondary'}">${p.active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}</span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${p.id}"><i class="bi bi-trash"></i> ลบ</button>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html;

        // Attach delete events
        tbody.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.closest('button').dataset.id;
                if (confirm('คุณต้องการลบโครงการนี้ใช่หรือไม่?')) {
                    try {
                        await deleteProject(id);
                        loadData();
                    } catch (err) {
                        alert('Error: ' + err.message);
                    }
                }
            });
        });
    }

    document.getElementById('addProjectForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        btn.disabled = true;
        
        try {
            await addProject({
                name: document.getElementById('proj_name').value,
                hospital: document.getElementById('proj_hospital').value,
                color: document.getElementById('proj_color').value,
                sort_order: document.getElementById('proj_sort').value,
                active: 1
            });
            e.target.reset();
            document.getElementById('proj_color').value = '#1a73e8';
            document.getElementById('proj_sort').value = '1';
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
