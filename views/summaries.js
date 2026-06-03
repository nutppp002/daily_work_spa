import { getSummaries, saveSummary, deleteSummary, getSummary, aiExpandText } from '../services/summaries.js';
import { getPlan } from '../services/plans.js';
import { getProjects } from '../services/projects.js';
import { getMembers } from '../services/members.js';
import { getMorningTalks } from '../services/morningtalk.js';

export async function renderSummariesView(container, user) {
    const today = new Date().toISOString().split('T')[0];
    const themeColor = '#198754';

    const catConfig = [
        { id: 'cat_assigned', name: 'งานรับมอบหมาย', color: '#0d6efd', icon: 'bi-briefcase', emoji: '📋' },
        { id: 'cat_pending', name: 'งานค้างต่อจากเมื่อวันก่อน', color: '#fd7e14', icon: 'bi-arrow-repeat', emoji: '🔄' },
        { id: 'cat_urgent', name: 'งานเร่งด่วน (งานใหม่รับในวัน)', color: '#dc3545', icon: 'bi-lightning-charge', emoji: '⚡' },
        { id: 'cat_others', name: 'งานอื่น ๆ', color: '#6c757d', icon: 'bi-three-dots', emoji: '📝' }
    ];
    const summaryStatuses = ['เสร็จสิ้น', 'รอดำเนินการต่อ', 'ติดปัญหา/ล่าช้า'];

    let catBlocksHtml = '';
    catConfig.forEach(cat => {
        catBlocksHtml += `
            <div class="mb-3">
                <div class="fw-bold small mb-1" style="color: ${cat.color}; border-left: 3px solid ${cat.color}; padding-left: 5px;">
                    <i class="bi ${cat.icon} me-1"></i> ${cat.name}
                </div>
                <div id="container_${cat.id}"></div>
                <button type="button" class="btn btn-sm w-100 btn-add-item mt-1" data-cat="${cat.name}" data-catid="${cat.id}" 
                        style="border: 1px dashed ${cat.color}; color: ${cat.color}; background-color: transparent;">
                    + เพิ่มรายการ
                </button>
            </div>
        `;
    });

    container.innerHTML = `
        <style>
            @media (max-width: 767.98px) {
                #leftPanelSummaries { width: 100% !important; }
                #rightPanelSummaries { padding-left: 0 !important; margin-top: 20px; width: 100% !important; flex: none !important; }
            }
        </style>
        <div class="d-flex flex-column flex-md-row align-items-stretch" style="min-height: calc(100vh - 120px);">
            <div id="leftPanelSummaries" style="width: 45%; flex: 0 0 auto;">
                <div class="card p-0 mb-4 border-success h-100" style="border-top: 4px solid ${themeColor};">
                    <div class="text-white p-2 fw-bold d-flex justify-content-between align-items-center" style="background-color: ${themeColor};">
                        <div><i class="bi bi-journal-check"></i> บันทึกสรุปงานเย็น</div>
                        <button class="btn btn-sm btn-light py-0 px-2 fw-bold" id="copyPlanBtn" title="ดึงข้อมูลจากแผนงานเมื่อเช้า"><i class="bi bi-box-arrow-in-down"></i> ดึงแผนงาน</button>
                    </div>
                    <div class="p-3">
                        <form id="summaryForm">
                            <input type="hidden" id="summaryId" value="">
                            
                            <div class="mb-3">
                                <label class="form-label small text-muted mb-1">วันที่</label>
                                <input type="date" id="summaryDate" class="form-control" value="${today}" required>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label small text-muted mb-1">โครงการ</label>
                                <select id="summaryProject" class="form-select" required>
                                    <option value="">-- เลือกโครงการ --</option>
                                </select>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label small text-muted mb-1">สถานที่ปฏิบัติงาน (สำหรับส่งออก Text)</label>
                                <input type="text" id="summaryLocation" class="form-control" placeholder="เช่น รพ.บ้านหลวง">
                            </div>
                            
                            <div class="mb-4">
                                <label class="form-label small text-muted mb-1">สมาชิก</label>
                                <div class="input-group mb-1">
                                    <span class="input-group-text"><i class="bi bi-search"></i></span>
                                    <input type="text" id="memberSearch" class="form-control" placeholder="พิมพ์ชื่อเพื่อค้นหา...">
                                </div>
                                <select id="summaryMember" class="form-select" required>
                                    <option value="">-- เลือกสมาชิก --</option>
                                </select>
                            </div>
                            
                            <div class="fw-bold small mb-2 text-dark border-bottom pb-1">รายการสรุปงาน</div>
                            
                            ${catBlocksHtml}
                            
                            <div class="d-flex gap-2 mt-4">
                                <button type="button" class="btn btn-outline-secondary flex-grow-1" id="clearSummaryBtn">
                                    <i class="bi bi-file-earmark"></i> บันทึกฉบับร่าง
                                </button>
                                <button type="submit" class="btn flex-grow-1 text-white" style="background-color: ${themeColor};" id="saveSummaryBtn">
                                    [↓] บันทึกสรุปงาน
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            
            <!-- Resizer -->
            <div id="resizerSummaries" class="d-none d-md-flex align-items-center justify-content-center bg-light border-start border-end mx-2" style="width: 12px; cursor: col-resize; user-select: none; border-radius: 4px;">
                <i class="bi bi-grip-vertical text-secondary"></i>
            </div>
            
            <div id="rightPanelSummaries" style="flex: 1 1 0%; width: 0; min-width: 300px;">
                <div class="card p-0 h-100" style="border-top: 4px solid ${themeColor};">
                    <div class="text-white p-2 d-flex justify-content-between align-items-center" style="background-color: ${themeColor};">
                        <div class="fw-bold"><i class="bi bi-journal-text"></i> สรุปงานเย็น</div>
                        <div class="d-flex align-items-center gap-2">
                            <span class="small d-none d-lg-inline">จาก</span>
                            <input type="date" id="filterStartDate" class="form-control form-control-sm w-auto" value="${today}">
                            <span class="small d-none d-lg-inline">ถึง</span>
                            <input type="date" id="filterEndDate" class="form-control form-control-sm w-auto" value="${today}">
                            <button class="btn btn-sm btn-light" id="btnSearch"><i class="bi bi-search"></i></button>
                        </div>
                    </div>
                    <div class="p-4 bg-light overflow-auto flex-grow-1" id="summaryListContainer">
                        <div class="text-center py-5 text-muted">
                            <i class="bi bi-journal-x text-secondary" style="font-size: 3rem; opacity: 0.5;"></i>
                            <p class="mt-2">กำลังโหลด...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const projectSelect = document.getElementById('summaryProject');
    const memberSelect = document.getElementById('summaryMember');
    const memberSearch = document.getElementById('memberSearch');
    const listContainer = document.getElementById('summaryListContainer');
    const copyPlanBtn = document.getElementById('copyPlanBtn');
    
    let projects = [];
    let members = [];
    let allData = [];

    async function generateSummaryText(item) {
        const d = new Date(item.summary_date);
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        let dateStr = d.toLocaleDateString('th-TH', dateOptions);
        dateStr = dateStr.replace('พ.ศ.', '').trim(); 
        
        let text = `===================================\n`;
        text += `  สรุปงานประจำวัน — ${dateStr}\n`;
        text += `===================================\n`;
        text += `  โครงการ           : ${item.proj.name}\n`;
        text += `  สถานที่ปฏิบัติงาน : ${item.location || '-'}\n`;
        text += `  ผู้ปฏิบัติงาน      : ${item.mem.line_name || item.mem.nickname}\n`;
        text += `  วันที่ปฏิบัติงาน   : ${dateStr}\n`;
        text += `-----------------------------------\n`;

        try {
            const mtData = await getMorningTalks(item.summary_date, item.summary_date);
            const mtForProj = mtData.filter(mt => mt.project_id === item.project_id);
            if (mtForProj.length > 0) {
                text += `  🗣️ Morning Talk\n`;
                mtForProj.forEach((mt, idx) => {
                    const talkBy = members.find(m => m.id === mt.talk_by) || { nickname: 'Unknown', line_name: '' };
                    const talkByName = talkBy.line_name || talkBy.nickname;
                    const contentLines = mt.content.split('\n');
                    contentLines.forEach(line => {
                        text += `  ${line}\n`;
                    });
                    text += `  (Talk by: ${talkByName})\n`;
                    if (idx < mtForProj.length - 1) text += `\n`;
                });
                text += `-----------------------------------\n`;
            }
        } catch (e) {
            console.error("Failed to fetch morning talk", e);
        }

        catConfig.forEach(cat => {
            const catItems = (item.items || []).filter(t => t.category === cat.name);
            if (catItems.length > 0) {
                text += `  ${cat.emoji} ${cat.name}\n`;
                catItems.forEach((t, i) => {
                    text += `  ${i + 1}. ${t.title}\n`;
                    if (t.detail) {
                        const detailLines = t.detail.split('\n');
                        detailLines.forEach(line => text += `     ${line}\n`);
                    }
                    text += `     สถานะ : ${t.status}\n`;
                });
            }
        });

        text += `-----------------------------------\n`;
        text += `  ${item.mem.line_name || item.mem.nickname} รายงาน\n`;
        text += `===================================\n`;

        return text;
    }

    function downloadTextFile(filename, text) {
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    function createSummaryInput(catId, catName, item = { title: '', detail: '', status: 'เสร็จสิ้น' }) {
        const div = document.createElement('div');
        div.className = 'summary-item mb-2 p-2 border rounded bg-white position-relative';
        div.dataset.cat = catName;
        
        let statusOpts = '';
        summaryStatuses.forEach(s => statusOpts += `<option value="${s}" ${s===item.status?'selected':''}>${s}</option>`);

        div.innerHTML = `
            <button class="btn btn-sm btn-close position-absolute top-0 end-0 m-1 btn-remove-item" type="button" tabindex="-1"></button>
            <div class="row g-2 mb-2 pr-4">
                <div class="col-8">
                    <input type="text" class="form-control form-control-sm item-title fw-bold" placeholder="หัวข้องาน" value="${item.title}" required>
                </div>
                <div class="col-4">
                    <select class="form-select form-select-sm item-status">${statusOpts}</select>
                </div>
            </div>
            <div class="position-relative">
                <textarea class="form-control form-control-sm item-detail" rows="2" placeholder="รายละเอียดงาน...">${item.detail}</textarea>
                <button type="button" class="btn btn-sm btn-warning position-absolute bottom-0 end-0 m-1 ai-btn" title="AI ช่วยเขียนให้สมบูรณ์" style="opacity:0.9; padding: 0.1rem 0.3rem; font-size: 0.75rem;">
                    <i class="bi bi-magic"></i> AI
                </button>
            </div>
        `;
        
        div.querySelector('.btn-remove-item').addEventListener('click', () => div.remove());
        
        const aiBtn = div.querySelector('.ai-btn');
        aiBtn.addEventListener('click', async () => {
            const title = div.querySelector('.item-title').value.trim();
            const detailInput = div.querySelector('.item-detail');
            const detail = detailInput.value.trim();
            const projId = document.getElementById('summaryProject').value;
            const projName = projId ? projects.find(p => p.id === projId)?.name : '';
            
            if (!title) {
                alert("กรุณากรอกหัวข้องานก่อนใช้ AI");
                return;
            }

            aiBtn.disabled = true;
            aiBtn.innerHTML = '<span class="spinner-border spinner-border-sm" style="width: 10px; height: 10px;"></span>';
            try {
                const expanded = await aiExpandText(title, detail, projName);
                detailInput.value = expanded;
            } catch (err) {
                alert('AI Error: ' + err.message);
            } finally {
                aiBtn.disabled = false;
                aiBtn.innerHTML = '<i class="bi bi-magic"></i> AI';
            }
        });

        return div;
    }

    document.querySelectorAll('.btn-add-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const catId = e.target.dataset.catid;
            const catName = e.target.dataset.cat;
            document.getElementById('container_' + catId).appendChild(createSummaryInput(catId, catName));
        });
    });

    async function loadDropdowns() {
        projects = await getProjects();
        members = await getMembers();

        let projOpts = '<option value="">-- เลือกโครงการ --</option>';
        projects.forEach(p => projOpts += `<option value="${p.id}">${p.name}</option>`);
        projectSelect.innerHTML = projOpts;

        function populateMembers(filter = '') {
            let memOpts = '<option value="">-- เลือกสมาชิก --</option>';
            members.filter(m => m.nickname.toLowerCase().includes(filter.toLowerCase()) || (m.line_name||'').toLowerCase().includes(filter.toLowerCase())).forEach(m => {
                memOpts += `<option value="${m.id}">${m.nickname} (${m.line_name})</option>`;
            });
            memberSelect.innerHTML = memOpts;
        }
        populateMembers();

        memberSearch.addEventListener('input', (e) => {
            populateMembers(e.target.value);
            if (members.find(m => m.id === user.id)) {
                 memberSelect.value = user.id;
            }
        });

        memberSelect.value = user.id;
    }

    function renderItemsListHTML(items) {
        if (!items || items.length === 0) return '<p class="small text-muted mb-0">ไม่มีรายการงาน</p>';
        
        let html = '';
        catConfig.forEach(cat => {
            const catItems = items.filter(t => t.category === cat.name);
            if (catItems.length > 0) {
                html += `<div class="mb-3"><span class="small fw-bold" style="color:${cat.color}">${cat.name}</span><div class="ps-2 mt-1 border-start border-2 border-secondary border-opacity-25">`;
                catItems.forEach((t, i) => {
                    let statusColor = 'success';
                    if (t.status === 'รอดำเนินการต่อ') statusColor = 'warning text-dark';
                    if (t.status === 'ติดปัญหา/ล่าช้า') statusColor = 'danger';

                    html += `
                        <div class="mb-2">
                            <div class="fw-bold small text-dark">
                                ${i+1}. ${t.title} 
                                <span class="badge bg-${statusColor} ms-1" style="font-size:0.65rem;">${t.status}</span>
                            </div>
                            <div class="small text-muted" style="white-space: pre-wrap; margin-left: 14px;">${t.detail || '-'}</div>
                        </div>
                    `;
                });
                html += `</div></div>`;
            }
        });
        return html;
    }

    async function loadList() {
        listContainer.innerHTML = `
            <div class="text-center py-5 text-muted">
                <div class="spinner-border" style="color: ${themeColor};"></div>
                <p class="mt-2">กำลังโหลดข้อมูล...</p>
            </div>`;
            
        const start = document.getElementById('filterStartDate').value;
        const end = document.getElementById('filterEndDate').value;
        
        try {
            allData = await getSummaries(start, end);
            
            if (allData.length === 0) {
                listContainer.innerHTML = `
                    <div class="text-center py-5 text-muted">
                        <i class="bi bi-journal-x text-secondary" style="font-size: 3rem; opacity: 0.5;"></i>
                        <p class="mt-2">ยังไม่มีสรุปงานในช่วงวันที่ที่เลือก</p>
                    </div>`;
                return;
            }

            let html = '';
            const enrichedData = allData.map(item => {
                const proj = projects.find(p => p.id === item.project_id) || { name: 'Unknown Project' };
                const mem = members.find(m => m.id === item.member_id) || { nickname: 'Unknown', color: '#ccc', sort_order: 999 };
                return { ...item, proj, mem };
            }).sort((a, b) => {
                if(a.summary_date !== b.summary_date) return b.summary_date?.localeCompare(a.summary_date);
                return a.mem.sort_order - b.mem.sort_order;
            });

            enrichedData.forEach(item => {
                const d = new Date(item.summary_date);
                const dateStr = d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });

                html += `
                    <div class="card mb-3 shadow-sm border-0" style="border-left: 4px solid ${item.mem.color} !important;">
                        <div class="card-header bg-white d-flex justify-content-between align-items-center pb-2">
                            <div>
                                <span class="fw-bold"><i class="bi bi-person-circle"></i> ${item.mem.nickname}</span>
                                <span class="badge bg-light text-dark ms-2 border"><i class="bi bi-folder2"></i> ${item.proj.name}</span>
                                <span class="ms-2 small text-muted">${dateStr}</span>
                                ${item.location ? `<span class="ms-2 small text-muted"><i class="bi bi-geo-alt"></i> ${item.location}</span>` : ''}
                            </div>
                            <div class="d-flex align-items-center">
                                <button class="btn btn-sm btn-outline-success me-2 btn-export" data-id="${item.id}" title="ส่งออกเป็นไฟล์ Text"><i class="bi bi-file-text"></i> Export</button>
                                <div class="dropdown">
                                    <button class="btn btn-sm btn-link text-muted" type="button" data-bs-toggle="dropdown"><i class="bi bi-three-dots-vertical"></i></button>
                                    <ul class="dropdown-menu dropdown-menu-end">
                                        <li><button class="dropdown-item btn-edit" data-id="${item.id}"><i class="bi bi-pencil me-2"></i>แก้ไข</button></li>
                                        ${user.is_admin || item.member_id === user.id ? `<li><button class="dropdown-item text-danger btn-delete" data-id="${item.id}"><i class="bi bi-trash me-2"></i>ลบ</button></li>` : ''}
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div class="card-body pt-2">
                            ${renderItemsListHTML(item.items)}
                        </div>
                    </div>
                `;
            });
            listContainer.innerHTML = html;

            // Attach events
            listContainer.querySelectorAll('.btn-export').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const button = e.target.closest('button');
                    const id = button.dataset.id;
                    const item = enrichedData.find(x => x.id === id);
                    if(item) {
                        const originalHtml = button.innerHTML;
                        button.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
                        button.disabled = true;
                        
                        try {
                            const text = await generateSummaryText(item);
                            downloadTextFile(`สรุปงาน_${item.mem.nickname}_${item.summary_date}.txt`, text);
                        } catch (err) {
                            alert('Error generating text: ' + err.message);
                        } finally {
                            button.innerHTML = originalHtml;
                            button.disabled = false;
                        }
                    }
                });
            });

            listContainer.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.closest('button').dataset.id;
                    const item = allData.find(x => x.id === id);
                    if(item) {
                        document.getElementById('summaryId').value = item.id;
                        document.getElementById('summaryDate').value = item.summary_date;
                        document.getElementById('summaryProject').value = item.project_id;
                        document.getElementById('summaryMember').value = item.member_id;
                        document.getElementById('summaryLocation').value = item.location || '';
                        
                        catConfig.forEach(cat => {
                            document.getElementById('container_' + cat.id).innerHTML = '';
                        });

                        if(item.items) {
                            item.items.forEach(t => {
                                const catObj = catConfig.find(c => c.name === t.category);
                                if(catObj) {
                                    document.getElementById('container_' + catObj.id).appendChild(createSummaryInput(catObj.id, t.category, t));
                                }
                            });
                        }
                    }
                });
            });

            listContainer.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.target.closest('button').dataset.id;
                    if(confirm("ยืนยันการลบข้อมูลสรุปงานนี้?")) {
                        try {
                            await deleteSummary(id);
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

    copyPlanBtn.addEventListener('click', async () => {
        const memId = document.getElementById('summaryMember').value;
        const date = document.getElementById('summaryDate').value;
        if (!memId) return alert('กรุณาเลือกสมาชิกก่อน');
        
        try {
            const btn = copyPlanBtn;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
            btn.disabled = true;

            const myPlan = await getPlan(memId, date);
            if (myPlan && myPlan.tasks && myPlan.tasks.length > 0) {
                if (myPlan.project_id) document.getElementById('summaryProject').value = myPlan.project_id;

                let added = 0;
                myPlan.tasks.forEach(t => {
                    const catObj = catConfig.find(c => c.name === t.category);
                    if (catObj) {
                        document.getElementById('container_' + catObj.id).appendChild(createSummaryInput(catObj.id, t.category, { title: t.text, detail: '', status: 'เสร็จสิ้น' }));
                        added++;
                    }
                });
                if(added > 0) alert('ดึงข้อมูลจากแผนงานเมื่อเช้ามาแล้ว ' + added + ' รายการ');
            } else {
                alert('ไม่พบแผนงานของสมาชิกคนนี้ในวันที่เลือก');
            }
        } catch (e) {
            alert('Error fetching plan: ' + e.message);
        } finally {
            copyPlanBtn.innerHTML = '<i class="bi bi-box-arrow-in-down"></i> ดึงแผนงาน';
            copyPlanBtn.disabled = false;
        }
    });

    document.getElementById('clearSummaryBtn').addEventListener('click', () => {
        document.getElementById('summaryForm').reset();
        document.getElementById('summaryId').value = '';
        document.getElementById('summaryDate').value = today;
        document.getElementById('summaryMember').value = user.id;
        document.getElementById('summaryLocation').value = '';
        
        catConfig.forEach(cat => {
            document.getElementById('container_' + cat.id).innerHTML = '';
        });
    });

    document.getElementById('summaryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('saveSummaryBtn');
        btn.disabled = true;
        btn.innerHTML = 'กำลังบันทึก...';

        const id = document.getElementById('summaryId').value;
        const items = [];
        
        document.querySelectorAll('.summary-item').forEach(el => {
            const cat = el.dataset.cat;
            const title = el.querySelector('.item-title').value.trim();
            const detail = el.querySelector('.item-detail').value.trim();
            const status = el.querySelector('.item-status').value;
            if(title) {
                items.push({ category: cat, title, detail, status });
            }
        });

        const data = {
            summary_date: document.getElementById('summaryDate').value,
            project_id: document.getElementById('summaryProject').value,
            member_id: document.getElementById('summaryMember').value,
            location: document.getElementById('summaryLocation').value.trim(),
            report_time: new Date().toLocaleTimeString('th-TH'),
            items: items
        };

        try {
            await saveSummary(data, id ? id : null);
            document.getElementById('clearSummaryBtn').click(); 
            loadList();
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '[↓] บันทึกสรุปงาน';
        }
    });

    document.getElementById('btnSearch').addEventListener('click', loadList);

    // Resizer logic
    const resizer = document.getElementById('resizerSummaries');
    const leftPanel = document.getElementById('leftPanelSummaries');
    
    if (!window.appResizersAttached) {
        window.appResizersAttached = true;
        document.addEventListener('mousemove', (e) => {
            if (window.currentResizerData) {
                const { panel, containerRect } = window.currentResizerData;
                let newWidth = e.clientX - containerRect.left;
                if (newWidth < 300) newWidth = 300;
                if (newWidth > containerRect.width - 300) newWidth = containerRect.width - 300;
                panel.style.width = newWidth + 'px';
                e.preventDefault();
            }
        });
        document.addEventListener('mouseup', () => {
            if (window.currentResizerData) {
                window.currentResizerData = null;
                document.body.style.cursor = 'default';
            }
        });
    }

    resizer.addEventListener('mousedown', (e) => {
        window.currentResizerData = {
            panel: leftPanel,
            containerRect: leftPanel.parentElement.getBoundingClientRect()
        };
        document.body.style.cursor = 'col-resize';
    });

    await loadDropdowns();
    await loadList();
}
