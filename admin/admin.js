/* ==========================================================================
   ADMIN CONTROL PANEL LOGIC PRO
   - Xử lý đăng nhập Admin dambuicong / 281097
   - Giao diện Obsidian Gold chuẩn phong cách Luxury
   - Custom Modals thông báo & xác nhận sang trọng
   - Xử lý Duyệt đơn Donate
   - Quản lý Thành Viên & Tùy Chỉnh Xu (Tab Tăng / Tab Giảm)
   - Lịch sử giao dịch hiển thị Tên Khách Hàng thực tế (tra cứu từ User ID)
   ========================================================================== */

let pendingAdminConfirmCallback = null;
let currentAdjustUserId = null;
let currentAdjustMode = 'add';

document.addEventListener('DOMContentLoaded', () => {
    checkAdminSession();
    setupLoginForm();
    setupAdminModalEvents();
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
            showAdminAlert("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!");
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
            showAdminAlert("Đăng nhập Quản Trị Viên thành công!", () => {
                checkAdminSession();
            });
        } else {
            showAdminAlert("Tên đăng nhập hoặc mật khẩu Admin không chính xác!");
        }
    });
}

function adminLogout() {
    showAdminConfirm("Bạn có chắc chắn muốn thoát khỏi trang Quản trị?", () => {
        localStorage.removeItem('sim_pt_admin_logged_in');
        checkAdminSession();
    });
}

function showAdminAlert(message, onOk = null) {
    const modal = document.getElementById('adminAlertModal');
    const msgElem = document.getElementById('adminAlertMsg');
    const okBtn = document.getElementById('btnAdminAlertOk');

    if (msgElem) msgElem.textContent = message;
    if (modal) modal.classList.add('active');

    if (okBtn) {
        okBtn.onclick = () => {
            if (modal) modal.classList.remove('active');
            if (onOk) onOk();
        };
    }
}

function showAdminConfirm(message, onConfirm) {
    const modal = document.getElementById('adminConfirmModal');
    const msgElem = document.getElementById('adminConfirmMsg');
    const yesBtn = document.getElementById('btnAdminConfirmYes');
    const noBtn = document.getElementById('btnAdminConfirmNo');

    if (msgElem) msgElem.textContent = message;
    if (modal) modal.classList.add('active');

    if (yesBtn) {
        yesBtn.onclick = () => {
            if (modal) modal.classList.remove('active');
            if (onConfirm) onConfirm();
        };
    }

    if (noBtn) {
        noBtn.onclick = () => {
            if (modal) modal.classList.remove('active');
        };
    }
}

function setupAdminModalEvents() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(m => {
        m.addEventListener('click', (e) => {
            if (e.target === m) m.classList.remove('active');
        });
    });
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
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#94a3b8;">Chưa có yêu cầu Donate nào.</td></tr>`;
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
                    <button class="btn-admin-approve" onclick="handleApprove('${r.id}')">✅ Duyệt Donate</button>
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
    showAdminConfirm("Xác nhận DUYỆT yêu cầu Donate này? Hệ thống sẽ tự động cộng Xu cho khách và trích 50% hoa hồng cho người giới thiệu.", () => {
        const res = AuthStore.approveDonateRequest(reqId);
        showAdminAlert(res.message, () => {
            loadAdminDashboardData();
        });
    });
}

function handleReject(reqId) {
    showAdminConfirm("Xác nhận TỪ CHỐI yêu cầu Donate này?", () => {
        const res = AuthStore.rejectDonateRequest(reqId);
        showAdminAlert(res.message, () => {
            loadAdminDashboardData();
        });
    });
}

function renderUsersList() {
    if (typeof AuthStore === 'undefined') return;

    const users = AuthStore.getUsers();
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    let html = '';
    users.forEach(u => {
        const isAdmin = u.isAdmin || u.username.toLowerCase() === 'dambuicong';
        const deleteBtnHtml = isAdmin ? '' : `
            <button class="btn-admin-reject" style="margin-left:6px;" onclick="handleDeleteUser('${u.id}', '${u.username}')">🗑️ Xóa</button>
        `;

        html += `
            <tr>
                <td><strong>${u.username}</strong> ${isAdmin ? '<span class="badge-status status-approved">ADMIN</span>' : ''}</td>
                <td>${u.email}</td>
                <td><code style="color:#ffd700;">${u.refCode}</code></td>
                <td><strong style="color:#ffd700; font-size:1.1rem;">${u.coins} Xu</strong></td>
                <td>
                    <button class="btn-admin-adjust" onclick="openAdjustCoinsModal('${u.id}', '${u.username}', ${u.coins})">⚙️ Điều Chỉnh Xu</button>
                    ${deleteBtnHtml}
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

function handleDeleteUser(userId, username) {
    showAdminConfirm(`Bạn có chắc chắn muốn XÓA thành viên "${username}"? Thao tác này không thể hoàn tác!`, () => {
        const res = AuthStore.deleteUser(userId);
        showAdminAlert(res.message, () => {
            loadAdminDashboardData();
        });
    });
}

function openAdjustCoinsModal(userId, username, currentCoins) {
    currentAdjustUserId = userId;
    currentAdjustMode = 'add';

    document.getElementById('adjustTargetUsername').textContent = username;
    document.getElementById('adjustCurrentCoins').textContent = `${currentCoins} Xu`;
    document.getElementById('adjustCoinAmountInput').value = 5;

    switchAdjustTab('add');

    const modal = document.getElementById('adminAdjustCoinsModal');
    if (modal) modal.classList.add('active');
}

function switchAdjustTab(mode) {
    currentAdjustMode = mode;
    const tabAddBtn = document.getElementById('tabAdjustAdd');
    const tabSubBtn = document.getElementById('tabAdjustSub');
    const presetBox = document.getElementById('adjustPresetButtons');

    if (mode === 'add') {
        tabAddBtn.classList.add('active');
        tabSubBtn.classList.remove('active');
        presetBox.innerHTML = `
            <button type="button" class="btn-admin-adjust" onclick="setAdjustValue(5)">+5 Xu</button>
            <button type="button" class="btn-admin-adjust" onclick="setAdjustValue(10)">+10 Xu</button>
            <button type="button" class="btn-admin-adjust" onclick="setAdjustValue(20)">+20 Xu</button>
            <button type="button" class="btn-admin-adjust" onclick="setAdjustValue(50)">+50 Xu</button>
        `;
    } else {
        tabSubBtn.classList.add('active');
        tabAddBtn.classList.remove('active');
        presetBox.innerHTML = `
            <button type="button" class="btn-admin-adjust" style="background:#dc2626;" onclick="setAdjustValue(2)">-2 Xu</button>
            <button type="button" class="btn-admin-adjust" style="background:#dc2626;" onclick="setAdjustValue(5)">-5 Xu</button>
            <button type="button" class="btn-admin-adjust" style="background:#dc2626;" onclick="setAdjustValue(10)">-10 Xu</button>
            <button type="button" class="btn-admin-adjust" style="background:#dc2626;" onclick="setAdjustValue(20)">-20 Xu</button>
        `;
    }
}

function setAdjustValue(val) {
    document.getElementById('adjustCoinAmountInput').value = val;
}

function submitAdjustCoins() {
    if (!currentAdjustUserId) return;

    const val = parseInt(document.getElementById('adjustCoinAmountInput').value) || 0;
    if (val <= 0) {
        showAdminAlert("Vui lòng nhập số Xu hợp lệ lớn hơn 0!");
        return;
    }

    const delta = currentAdjustMode === 'add' ? val : -val;
    const actionText = currentAdjustMode === 'add' ? `Admin cộng thêm +${val} Xu` : `Admin trừ ${val} Xu`;

    const res = AuthStore.adminAdjustCoins(currentAdjustUserId, delta, actionText);

    const modal = document.getElementById('adminAdjustCoinsModal');
    if (modal) modal.classList.remove('active');

    showAdminAlert(res.message, () => {
        loadAdminDashboardData();
    });
}

// BẢNG NHẬT KÝ GIAO DỊCH (TỰ ĐỘNG TRA CỨU TÊN KHÁCH HÀNG TỪ USER ID)
function renderLogsList() {
    const tbody = document.getElementById('logsTableBody');
    if (!tbody) return;

    let logs = [];
    try {
        logs = JSON.parse(localStorage.getItem('sim_pt_coin_logs_v1')) || [];
    } catch (e) {}

    const users = (typeof AuthStore !== 'undefined') ? AuthStore.getUsers() : [];

    if (logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#94a3b8;">Chưa có nhật ký giao dịch.</td></tr>`;
        return;
    }

    let html = '';
    logs.forEach(l => {
        const timeStr = new Date(l.timestamp).toLocaleString('vi-VN');
        const changeStr = l.change >= 0 ? `<span style="color:#4ade80; font-weight:bold;">+${l.change} Xu</span>` : `<span style="color:#f87171; font-weight:bold;">${l.change} Xu</span>`;

        // Tự động tìm Tên Khách Hàng nếu log cũ lưu dạng ID
        let displayName = l.username;
        if (!displayName || displayName.startsWith('usr_')) {
            const matchUser = users.find(u => u.id === l.userId);
            if (matchUser) displayName = matchUser.username;
            else displayName = l.username || l.userId || 'Khách';
        }

        const cleanAction = (l.action || '').replace(/Nạp Xu/gi, '').trim();

        html += `
            <tr>
                <td>${timeStr}</td>
                <td><strong style="color:var(--gold-glow);">${displayName}</strong></td>
                <td>${cleanAction}</td>
                <td>${changeStr}</td>
                <td><strong>${l.balanceAfter} Xu</strong></td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}
