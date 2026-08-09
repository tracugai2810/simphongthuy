/* ==========================================================================
   ADMIN CONTROL PANEL LOGIC PRO
   - Xử lý đăng nhập Admin dambuicong / 281097
   - Giao diện Obsidian Gold chuẩn phong cách Luxury
   - Xử lý Duyệt nạp xu Donate (Tự động cộng Xu & Tự động trích 50% hoa hồng)
   - Xử lý Quản lý thành viên & Nhật ký giao dịch
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    checkAdminSession();
    setupLoginForm();
});

function checkAdminSession() {
    const isAdminLoggedIn = localStorage.getItem('sim_pt_admin_logged_in') === 'true';
    const loginBox = document.getElementById('adminLoginBox');
    const dashboard = document.getElementById('adminDashboard');

    if (isAdminLoggedIn) {
        if (loginBox) loginBox.style.display = 'none';
        if (dashboard) dashboard.style.display = 'block';
        loadAdminDashboardData();
    } else {
        if (loginBox) loginBox.style.display = 'block';
        if (dashboard) dashboard.style.display = 'none';
    }
}

function setupLoginForm() {
    const form = document.getElementById('adminLoginForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const u = document.getElementById('adminUser').value.trim();
        const p = document.getElementById('adminPass').value.trim();

        if (!u || !p) {
            alert("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!");
            return;
        }

        const isDefaultAdmin = (u.toLowerCase() === 'dambuicong' && p === '281097');
        let isStoreAdmin = false;

        if (typeof AuthStore !== 'undefined') {
            const users = AuthStore.getUsers();
            const foundUser = users.find(usr => 
                (usr.username.toLowerCase() === u.toLowerCase() || usr.email.toLowerCase() === u.toLowerCase()) && 
                usr.passwordHash === p && 
                (usr.isAdmin || usr.username.toLowerCase() === 'dambuicong')
            );
            if (foundUser) isStoreAdmin = true;
        }

        if (isDefaultAdmin || isStoreAdmin) {
            localStorage.setItem('sim_pt_admin_logged_in', 'true');
            showAdminToast("Đăng nhập Admin thành công!");
            checkAdminSession();
        } else {
            alert("Tên đăng nhập hoặc mật khẩu Admin không đúng!");
        }
    });
}

function showAdminToast(msg) {
    alert(msg);
}

function adminLogout() {
    localStorage.removeItem('sim_pt_admin_logged_in');
    checkAdminSession();
}

function switchAdminTab(tabName) {
    document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(sec => sec.style.display = 'none');

    if (tabName === 'donate') {
        document.getElementById('tabDonateBtn').classList.add('active');
        document.getElementById('sectionDonate').style.display = 'block';
    } else if (tabName === 'users') {
        document.getElementById('tabUsersBtn').classList.add('active');
        document.getElementById('sectionUsers').style.display = 'block';
    } else if (tabName === 'logs') {
        document.getElementById('tabLogsBtn').classList.add('active');
        document.getElementById('sectionLogs').style.display = 'block';
    }

    loadAdminDashboardData();
}

function loadAdminDashboardData() {
    renderDonateRequests();
    renderUsersList();
    renderLogsList();
}

function renderDonateRequests() {
    if (typeof AuthStore === 'undefined') return;

    const reqs = AuthStore.getDonateRequests();
    const tbody = document.getElementById('donateTableBody');
    const pendingBadge = document.getElementById('pendingCount');

    const pendingCount = reqs.filter(r => r.status === 'pending').length;
    if (pendingBadge) pendingBadge.textContent = pendingCount;

    if (!tbody) return;

    if (reqs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#94a3b8;">Chưa có yêu cầu donate nào.</td></tr>`;
        return;
    }

    let html = '';
    reqs.forEach(r => {
        let statusHtml = '<span class="badge-status status-pending">Chờ Duyệt</span>';
        if (r.status === 'approved') statusHtml = '<span class="badge-status status-approved">Đã Duyệt</span>';
        if (r.status === 'rejected') statusHtml = '<span class="badge-status status-rejected">Đã Từ Chối</span>';

        const timeStr = new Date(r.createdAt).toLocaleString('vi-VN');
        const amountStr = (r.amountVnd || 0).toLocaleString('vi-VN') + ' VNĐ';

        let actionBtns = '-';
        if (r.status === 'pending') {
            actionBtns = `
                <div style="display:flex; gap:6px;">
                    <button class="btn-admin-approve" onclick="handleApprove('${r.id}')">✅ Duyệt Nạp</button>
                    <button class="btn-admin-reject" onclick="handleReject('${r.id}')">❌ Từ Chối</button>
                </div>
            `;
        }

        html += `
            <tr>
                <td>${timeStr}</td>
                <td><strong>${r.username}</strong></td>
                <td>${amountStr}</td>
                <td><strong style="color:#ffd700;">+${r.coinAmount} Xu</strong></td>
                <td>${statusHtml}</td>
                <td>${actionBtns}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

function handleApprove(reqId) {
    if (!confirm("Xác nhận DUYỆT yêu cầu nạp này? Hệ thống sẽ tự động cộng Xu cho khách và trích 50% hoa hồng cho người giới thiệu.")) return;

    const res = AuthStore.approveDonateRequest(reqId);
    alert(res.message);
    loadAdminDashboardData();
}

function handleReject(reqId) {
    if (!confirm("Xác nhận TỪ CHỐI yêu cầu này?")) return;

    const res = AuthStore.rejectDonateRequest(reqId);
    alert(res.message);
    loadAdminDashboardData();
}

function renderUsersList() {
    if (typeof AuthStore === 'undefined') return;

    const users = AuthStore.getUsers();
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    let html = '';
    users.forEach(u => {
        html += `
            <tr>
                <td><strong>${u.username}</strong> ${u.isAdmin ? '<span class="badge-status status-approved">ADMIN</span>' : ''}</td>
                <td>${u.email}</td>
                <td><code style="color:#ffd700;">${u.refCode}</code></td>
                <td><strong style="color:#ffd700; font-size:1.1rem;">${u.coins} Xu</strong></td>
                <td>
                    <div style="display:flex; gap:6px; align-items:center;">
                        <button class="btn-admin-adjust" onclick="handleAdjustCoins('${u.id}', 5)">+5 Xu</button>
                        <button class="btn-admin-adjust" onclick="handleAdjustCoins('${u.id}', 20)">+20 Xu</button>
                        <button class="btn-admin-adjust" style="background:#dc2626;" onclick="handleAdjustCoins('${u.id}', -2)">-2 Xu</button>
                    </div>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

function handleAdjustCoins(userId, delta) {
    const res = AuthStore.adminAdjustCoins(userId, delta, `Admin thủ công ${delta > 0 ? '+' : ''}${delta} Xu`);
    alert(res.message);
    loadAdminDashboardData();
}

function renderLogsList() {
    const tbody = document.getElementById('logsTableBody');
    if (!tbody) return;

    let logs = [];
    try {
        logs = JSON.parse(localStorage.getItem('sim_pt_coin_logs_v1')) || [];
    } catch (e) {}

    if (logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#94a3b8;">Chưa có nhật ký giao dịch.</td></tr>`;
        return;
    }

    let html = '';
    logs.forEach(l => {
        const timeStr = new Date(l.timestamp).toLocaleString('vi-VN');
        const changeStr = l.change >= 0 ? `<span style="color:#4ade80;">+${l.change} Xu</span>` : `<span style="color:#f87171;">${l.change} Xu</span>`;

        html += `
            <tr>
                <td>${timeStr}</td>
                <td><code>${l.userId}</code></td>
                <td>${l.action}</td>
                <td><strong>${changeStr}</strong></td>
                <td><strong>${l.balanceAfter} Xu</strong></td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}
