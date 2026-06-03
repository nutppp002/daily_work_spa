import { db } from '../firebase-config.js';
import { collection, getDocs, query, where, addDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// SHA-256 Hashing for simple password storage
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function checkHasMembers() {
    const membersRef = collection(db, "members");
    const snapshot = await getDocs(membersRef);
    return !snapshot.empty;
}

export async function login(username, password) {
    if (password !== '1234') {
        throw new Error('รหัสผ่านไม่ถูกต้อง (ใช้รหัสผ่าน 1234)');
    }

    const membersRef = collection(db, "members");
    const q = query(membersRef, where("username", "==", username), where("active", "==", 1));
    const snapshot = await getDocs(q);
    
    let user = null;
    snapshot.forEach((doc) => {
        const data = doc.data();
        user = { id: doc.id, ...data };
    });
    
    if (user) {
        localStorage.setItem('daily_work_uid', user.id);
        localStorage.setItem('daily_work_nickname', user.nickname);
        localStorage.setItem('daily_work_is_admin', user.is_admin);
        return user;
    }
    throw new Error('ไม่พบชื่อผู้ใช้นี้ในระบบ');
}

export function logout() {
    localStorage.removeItem('daily_work_uid');
    localStorage.removeItem('daily_work_nickname');
    localStorage.removeItem('daily_work_is_admin');
}

export function getCurrentUser() {
    const uid = localStorage.getItem('daily_work_uid');
    if (!uid) return null;
    return {
        id: uid,
        nickname: localStorage.getItem('daily_work_nickname'),
        is_admin: parseInt(localStorage.getItem('daily_work_is_admin') || '0')
    };
}

export async function setupFirstAdmin(setupData) {
    const { pname, hospital, fullname, nickname, username, password, color } = setupData;
    
    // Create first project
    const projRef = await addDoc(collection(db, "projects"), {
        name: pname,
        hospital: hospital,
        color: color,
        sort_order: 1,
        active: 1
    });

    // Hash password
    const hashed = await hashPassword(password);

    // Create admin member
    const memberRef = await addDoc(collection(db, "members"), {
        project_id: projRef.id,
        line_name: fullname || nickname,
        nickname: nickname,
        username: username,
        password_hash: hashed,
        color: color,
        sort_order: 1,
        active: 1,
        is_admin: 1,
        site_team: '',
        site_start_date: '',
        site_end_date: ''
    });

    localStorage.setItem('daily_work_uid', memberRef.id);
    localStorage.setItem('daily_work_nickname', nickname);
    localStorage.setItem('daily_work_is_admin', '1');
}
