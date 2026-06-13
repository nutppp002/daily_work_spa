import { checkHasMembers, login, logout, getCurrentUser, setupFirstAdmin } from './services/auth.js?v=1.1';
import { renderProjectsView } from './views/projects.js?v=1.1';
import { renderMembersView } from './views/members.js?v=1.1';
import { renderPlansView } from './views/plans.js?v=1.1';
import { renderSummariesView } from './views/summaries.js?v=1.1';
import { renderMorningTalkView } from './views/morningtalk.js?v=1.1';
import { renderDashboardView } from './views/dashboard.js?v=1.1';
const appDiv = document.getElementById('app');

async function renderApp() {
    appDiv.innerHTML = `
        <div class="d-flex justify-content-center align-items-center vh-100">
            <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>
        </div>
    `;

    try {
        const hasMembers = await checkHasMembers();
        if (!hasMembers) {
            renderSetup();
            return;
        }

        const user = getCurrentUser();
        if (!user) {
            renderLogin();
            return;
        }

        renderDashboard(user);
    } catch (error) {
        console.error("Firebase Error:", error);
        appDiv.innerHTML = `<div class="alert alert-danger m-5">เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล: ${error.message}</div>`;
    }
}

function renderSetup() {
    appDiv.innerHTML = `
    <div class="auth-bg">
        <div class="setup-card">
          <div class="auth-header">
            <i class="bi bi-gear-fill" style="font-size:2.2rem"></i>
            <div class="mt-2 fw-bold" style="font-size:1.1rem">ตั้งค่าระบบครั้งแรก</div>
            <div style="opacity:.75;font-size:.85rem;margin-top:4px">กรอกข้อมูลโครงการและผู้ดูแลระบบ</div>
          </div>
          <div class="auth-body">
            <form id="setupForm">
              <div class="mb-3">
                <label class="form-label"><i class="bi bi-folder2 me-1"></i>ชื่อโครงการ</label>
                <input type="text" id="setup_pname" class="form-control" placeholder="เช่น On Site..." required>
              </div>
              <div class="mb-3">
                <label class="form-label"><i class="bi bi-hospital me-1"></i>สถานที่</label>
                <input type="text" id="setup_hospital" class="form-control" placeholder="เช่น รพ. ...">
              </div>
              <hr class="my-3">
              <div class="text-muted small fw-bold mb-2"><i class="bi bi-person-fill-gear me-1"></i>ข้อมูลผู้ดูแลระบบ (Admin)</div>
              <div class="mb-2">
                <label class="form-label">ชื่อ-นามสกุล</label>
                <input type="text" id="setup_fullname" class="form-control form-control-sm">
              </div>
              <div class="mb-2">
                <label class="form-label">ชื่อเล่น</label>
                <input type="text" id="setup_nickname" class="form-control form-control-sm" required>
              </div>
              <div class="row g-2 mb-3">
                <div class="col-6">
                  <label class="form-label">ชื่อผู้ใช้ (login)</label>
                  <input type="text" id="setup_username" class="form-control form-control-sm" required>
                </div>
                <div class="col-6">
                  <label class="form-label">รหัสผ่าน</label>
                  <input type="password" id="setup_password" class="form-control form-control-sm" required minlength="4">
                </div>
              </div>
              <div class="mb-4">
                <label class="form-label">สีประจำตัว Admin</label>
                <input type="color" id="setup_color" value="#f57c00" class="form-control form-control-color form-control-sm">
              </div>
              <button type="submit" class="btn btn-primary w-100 py-2 fw-bold" id="setupBtn">
                <i class="bi bi-rocket-takeoff me-2"></i>เริ่มต้นใช้งานระบบ
              </button>
            </form>
          </div>
        </div>
    </div>
    `;

    document.getElementById('setupForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('setupBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>กำลังบันทึก...';
        
        const data = {
            pname: document.getElementById('setup_pname').value,
            hospital: document.getElementById('setup_hospital').value,
            fullname: document.getElementById('setup_fullname').value,
            nickname: document.getElementById('setup_nickname').value,
            username: document.getElementById('setup_username').value,
            password: document.getElementById('setup_password').value,
            color: document.getElementById('setup_color').value
        };

        try {
            await setupFirstAdmin(data);
            renderApp();
        } catch (error) {
            alert('Error: ' + error.message);
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-rocket-takeoff me-2"></i>เริ่มต้นใช้งานระบบ';
        }
    });
}

function renderLogin() {
    appDiv.innerHTML = `
    <div class="auth-bg">
        <div class="auth-card">
          <div class="auth-header">
            <i class="bi bi-calendar2-check-fill" style="font-size:2.4rem"></i>
            <div class="mt-2 fw-bold" style="font-size:1.1rem">ระบบแผนงาน & สรุปงาน</div>
            <div style="opacity:.75;font-size:.85rem;margin-top:4px">On Site BMS-HOSxP XE</div>
          </div>
          <div class="auth-body">
            <div id="loginAlert"></div>
            <form id="loginForm">
              <div class="mb-3">
                <label class="form-label">ชื่อผู้ใช้</label>
                <div class="input-group">
                  <span class="input-group-text"><i class="bi bi-person"></i></span>
                  <input type="text" id="login_username" class="form-control" autofocus required>
                </div>
              </div>
              <div class="mb-4">
                <label class="form-label">รหัสผ่าน</label>
                <div class="input-group">
                  <span class="input-group-text"><i class="bi bi-lock"></i></span>
                  <input type="password" id="login_password" class="form-control" required>
                </div>
              </div>
              <button type="submit" class="btn btn-primary w-100 py-2 fw-bold" id="loginBtn">
                <i class="bi bi-box-arrow-in-right me-2"></i>เข้าสู่ระบบ
              </button>
            </form>
          </div>
        </div>
    </div>
    `;

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('loginBtn');
        const alertDiv = document.getElementById('loginAlert');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>กำลังตรวจสอบ...';
        alertDiv.innerHTML = '';

        try {
            await login(
                document.getElementById('login_username').value,
                document.getElementById('login_password').value
            );
            renderApp();
        } catch (error) {
            alertDiv.innerHTML = `<div class="alert alert-danger py-2 small mb-3"><i class="bi bi-exclamation-triangle-fill me-1"></i>${error.message}</div>`;
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>เข้าสู่ระบบ';
        }
    });
}


function renderDashboard(user) {
    appDiv.innerHTML = `
        <nav class="navbar navbar-expand-lg navbar-dark shadow-sm sticky-top" style="background: linear-gradient(135deg, #1a5dc8, #0d2e6b);">
            <div class="container-fluid px-3">
                <a class="navbar-brand fw-bold" href="#dashboard">
                    <i class="bi bi-calendar2-check-fill"></i> ระบบแผนงานประจำวัน
                </a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#topMenu">
                    <span class="navbar-toggler-icon"></span>
                </button>
                
                <div class="collapse navbar-collapse" id="topMenu">
                    <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                        <li class="nav-item">
                            <a href="#dashboard" class="nav-link" id="nav-dashboard"><i class="bi bi-speedometer2"></i> แดชบอร์ด</a>
                        </li>
                        <li class="nav-item">
                            <a href="#plans" class="nav-link" id="nav-plans"><i class="bi bi-list-task"></i> แผนงานเช้า</a>
                        </li>
                        <li class="nav-item">
                            <a href="#summaries" class="nav-link" id="nav-summaries"><i class="bi bi-journal-check"></i> สรุปงานเย็น</a>
                        </li>
                        <li class="nav-item">
                            <a href="#morningtalk" class="nav-link" id="nav-morningtalk"><i class="bi bi-chat-square-text"></i> Morning Talk</a>
                        </li>
                        ${user.is_admin ? `
                        <li class="nav-item dropdown">
                            <a class="nav-link dropdown-toggle" href="#" id="adminMenu" role="button" data-bs-toggle="dropdown">
                                <i class="bi bi-shield-lock"></i> ผู้ดูแลระบบ
                            </a>
                            <ul class="dropdown-menu shadow border-0 mt-2">
                                <li><a class="dropdown-item text-dark" href="#projects" id="nav-projects"><i class="bi bi-folder2 text-secondary"></i> โครงการ</a></li>
                                <li><a class="dropdown-item text-dark" href="#members" id="nav-members"><i class="bi bi-people text-secondary"></i> สมาชิก</a></li>
                            </ul>
                        </li>
                        ` : ''}
                    </ul>
                    <div class="d-flex align-items-center text-white gap-3 ms-auto">
                        <span class="fw-bold"><i class="bi bi-person-circle me-1"></i> ${user.nickname}</span>
                        <button class="btn btn-sm btn-outline-light" id="logoutBtn"><i class="bi bi-box-arrow-right"></i> ออกจากระบบ</button>
                    </div>
                </div>
            </div>
        </nav>

        <div class="main-content container-fluid" id="page-content">
            <!-- Dynamic view goes here -->
        </div>
    `;

    document.getElementById('logoutBtn').addEventListener('click', () => {
        logout();
        renderApp();
    });


    // Simple Hash Router
    function handleRoute() {
        const hash = window.location.hash || '#dashboard';
        const pageContent = document.getElementById('page-content');
        
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
        const activeLink = document.getElementById('nav-' + hash.replace('#', ''));
        if (activeLink) activeLink.classList.add('active');

        switch(hash) {
            case '#projects':
                renderProjectsView(pageContent, user);
                break;
            case '#members':
                renderMembersView(pageContent, user);
                break;
            case '#plans':
                renderPlansView(pageContent, user);
                break;
            case '#summaries':
                renderSummariesView(pageContent, user);
                break;
            case '#morningtalk':
                renderMorningTalkView(pageContent, user);
                break;
            case '#dashboard':
            default:
                renderDashboardView(pageContent, user);
                break;
        }
    }

    window.addEventListener('hashchange', handleRoute);
    handleRoute(); // Call initially
}

// Boot up
renderApp();
