import { getMembers } from '../services/members.js';
import { getProjects } from '../services/projects.js';
import { getPlans } from '../services/plans.js';
import { getSummaries } from '../services/summaries.js';

export async function renderDashboardView(container, user) {
    const today = new Date().toISOString().split('T')[0];

    container.innerHTML = `
        <div class="d-flex flex-wrap justify-content-between align-items-center mb-3 pb-2 border-bottom">
            <div class="d-flex align-items-center gap-3 mb-2 mb-md-0">
                <h4 class="mb-0 text-primary"><i class="bi bi-layout-text-window-reverse"></i> ภาพรวมประจำวัน</h4>
                <div class="input-group input-group-sm" style="width: 200px;">
                    <span class="input-group-text bg-white border-end-0"><i class="bi bi-search text-muted"></i></span>
                    <input type="text" id="dashSearch" class="form-control border-start-0" placeholder="ค้นหาชื่อสมาชิก...">
                </div>
            </div>
            <div class="d-flex align-items-center gap-1">
                <button class="btn btn-sm btn-outline-secondary px-2" id="btnPrevDay"><i class="bi bi-chevron-left"></i></button>
                <input type="date" id="dashDate" class="form-control form-control-sm text-center" style="width: 130px;" value="${today}">
                <button class="btn btn-sm btn-outline-secondary px-2" id="btnNextDay"><i class="bi bi-chevron-right"></i></button>
                <button class="btn btn-sm btn-primary ms-1 px-3" id="btnToday">วันนี้</button>
            </div>
        </div>

        <div class="row g-3 mb-4" id="statsContainer">
            <!-- Stats load here -->
        </div>

        <div class="row g-3" id="cardsContainer">
            <div class="text-center py-5 text-muted w-100">
                <div class="spinner-border text-primary"></div>
                <p class="mt-2">กำลังโหลดข้อมูลภาพรวม...</p>
            </div>
        </div>
    `;

    const dateInput = document.getElementById('dashDate');
    const searchInput = document.getElementById('dashSearch');
    const statsContainer = document.getElementById('statsContainer');
    const cardsContainer = document.getElementById('cardsContainer');
    
    let members = [];
    let projects = [];
    let plans = [];
    let summaries = [];
    let currentDate = today;

    async function loadData() {
        cardsContainer.innerHTML = `
            <div class="text-center py-5 text-muted w-100">
                <div class="spinner-border text-primary"></div>
                <p class="mt-2">กำลังโหลดข้อมูลภาพรวม...</p>
            </div>`;
        
        try {
            if(members.length === 0) members = await getMembers();
            if(projects.length === 0) projects = await getProjects();
            
            plans = await getPlans(currentDate, currentDate);
            summaries = await getSummaries(currentDate, currentDate);
            
            renderDashboard();
        } catch(e) {
            cardsContainer.innerHTML = `<div class="alert alert-danger w-100">Error: ${e.message}</div>`;
        }
    }

    function renderDashboard(filter = '') {
        const filteredMembers = members.filter(m => m.active !== 0 && m.nickname.toLowerCase().includes(filter.toLowerCase()));
        
        let countMembers = members.filter(m => m.active !== 0).length;
        let countPlans = 0;
        let countSummaries = 0;

        let cardsHtml = '';

        filteredMembers.sort((a,b) => a.sort_order - b.sort_order).forEach(m => {
            const proj = projects.find(p => p.id === m.project_id) || { name: '-' };
            const mPlan = plans.find(p => p.member_id === m.id);
            const mSum = summaries.find(s => s.member_id === m.id);

            if(mPlan) countPlans++;
            if(mSum) countSummaries++;

            let statusText = '<i class="bi bi-hourglass-split"></i> ยังไม่ส่งแผนงาน';
            let statusColor = 'text-muted';
            
            if(mPlan && !mSum) {
                statusText = '<i class="bi bi-clock-history"></i> รอสรุปเย็น';
                statusColor = 'text-warning';
            } else if(mPlan && mSum) {
                statusText = '<i class="bi bi-check-circle-fill"></i> ส่งสรุปงานแล้ว';
                statusColor = 'text-success';
            } else if(!mPlan && mSum) {
                statusText = '<i class="bi bi-info-circle-fill"></i> มีสรุปเย็น (ไม่มีแผนเช้า)';
                statusColor = 'text-info';
            }

            const planTime = mPlan && mPlan.report_time ? mPlan.report_time : '-';
            const sumTime = mSum && mSum.report_time ? mSum.report_time : '-'; // Adjust if you add report_time to summary

            cardsHtml += `
                <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                    <div class="card h-100 shadow-sm border-0 rounded-3 overflow-hidden">
                        <div class="card-body p-3">
                            <div class="d-flex align-items-start mb-2">
                                <div class="rounded-circle flex-shrink-0" style="width: 40px; height: 40px; background-color: ${m.color};"></div>
                                <div class="ms-3 flex-grow-1 min-w-0">
                                    <div class="fw-bold fs-5 text-truncate" style="color: ${m.color};">${m.nickname}</div>
                                    <div class="small text-primary text-truncate"><i class="bi bi-folder2"></i> ${proj.name}</div>
                                    <div class="small text-muted text-truncate" style="font-size: 0.75rem;">${m.position || m.site_team || 'เจ้าหน้าที่'}</div>
                                </div>
                            </div>
                            <div class="text-center mt-3 mb-2 small fw-bold ${statusColor}">${statusText}</div>
                        </div>
                        <div class="card-footer bg-white p-2 border-top-0">
                            <div class="row g-1 text-center mb-2" style="font-size: 0.8rem; background-color: #fdf3e7; border-radius: 4px; padding: 4px 0;">
                                <div class="col-6 border-end text-warning">
                                    <i class="bi bi-sunrise"></i> แผนเช้า <span class="text-dark">${planTime}</span>
                                </div>
                                <div class="col-6 text-warning">
                                    <i class="bi bi-sunset"></i> สรุปเย็น <span class="text-dark">${sumTime}</span>
                                </div>
                            </div>
                            <div class="row g-1">
                                <div class="col-6">
                                    <a href="#plans" class="btn btn-primary btn-sm w-100 py-1" style="font-size: 0.8rem;"><i class="bi bi-plus"></i> เพิ่มแผน</a>
                                </div>
                                <div class="col-6">
                                    <a href="#summaries" class="btn btn-success btn-sm w-100 py-1" style="font-size: 0.8rem;"><i class="bi bi-plus"></i> เพิ่มสรุป</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        const countWaitSum = countMembers - countSummaries;

        statsContainer.innerHTML = `
            <div class="col-6 col-md-3">
                <div class="card shadow-sm border-0 border-start border-primary border-4 text-center py-2">
                    <div class="fs-3 fw-bold text-primary">${countMembers}</div>
                    <div class="small text-muted">สมาชิก</div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="card shadow-sm border-0 border-start border-success border-4 text-center py-2">
                    <div class="fs-3 fw-bold text-success">${countPlans}</div>
                    <div class="small text-muted"><i class="bi bi-person-up"></i> ส่งแผนเช้า</div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="card shadow-sm border-0 border-start border-purple border-4 text-center py-2" style="border-left-color: #6f42c1 !important;">
                    <div class="fs-3 fw-bold" style="color: #6f42c1;">${countSummaries}</div>
                    <div class="small text-muted"><i class="bi bi-person-down"></i> ส่งสรุปเย็น</div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="card shadow-sm border-0 border-start border-warning border-4 text-center py-2">
                    <div class="fs-3 fw-bold text-warning">${countWaitSum < 0 ? 0 : countWaitSum}</div>
                    <div class="small text-muted">รอสรุปเย็น</div>
                </div>
            </div>
        `;

        if (filteredMembers.length === 0) {
            cardsContainer.innerHTML = `<div class="text-center py-5 text-muted w-100">ไม่พบข้อมูลสมาชิก</div>`;
        } else {
            cardsContainer.innerHTML = cardsHtml;
        }
    }

    searchInput.addEventListener('input', (e) => {
        renderDashboard(e.target.value);
    });

    dateInput.addEventListener('change', (e) => {
        currentDate = e.target.value;
        loadData();
    });

    document.getElementById('btnPrevDay').addEventListener('click', () => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() - 1);
        currentDate = d.toISOString().split('T')[0];
        dateInput.value = currentDate;
        loadData();
    });

    document.getElementById('btnNextDay').addEventListener('click', () => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + 1);
        currentDate = d.toISOString().split('T')[0];
        dateInput.value = currentDate;
        loadData();
    });

    document.getElementById('btnToday').addEventListener('click', () => {
        currentDate = today;
        dateInput.value = currentDate;
        loadData();
    });

    // Initial load
    loadData();
}
