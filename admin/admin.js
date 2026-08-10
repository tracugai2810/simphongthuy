/* ==========================================================================
   ADMIN CONTROL PANEL LOGIC PRO
   - Xử lý đăng nhập Admin dambuicong / 140498
   - Giao diện Obsidian Gold chuẩn phong cách Luxury
   - Custom Modals thông báo, xác nhận & ĐẶT LẠI MẬT KHẨU THÀNH VIÊN
   - Xử lý Duyệt đơn Donate
   - Quản lý Thành Viên, Tùy Chỉnh Xu & Đổi Mật Khẩu cho Khách Hàng
   ========================================================================== */

let pendingAdminConfirmCallback = null;
let currentAdjustUserId = null;
let currentAdjustMode = 'add';
let currentResetUserId = null;

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

        const isDefaultAdmin = (u.toLowerCase() === 'dambuicong' && p === '140498');
        let isStoreAdmin = false;

        if (typeof AuthStore !== 'undefined') {
            const users = AuthStore.getUsers();
            const foundUser = users.find(usr => 
                (usr.username.toLowerCase() === u.toLowerCase() || (usr.email && usr.email.toLowerCase() === u.toLowerCase())) && 
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
    localStorage.removeItem('sim_pt_admin_logged_in');
    checkAdminSession();
}

function switchAdminTab(tabName) {
    const tabDonateBtn = document.getElementById('tabDonateBtn');
    const tabUsersBtn = document.getElementById('tabUsersBtn');
    const tabLogsBtn = document.getElementById('tabLogsBtn');

    const adminTabDonates = document.getElementById('adminTabDonates');
    const adminTabUsers = document.getElementById('adminTabUsers');
    const adminTabLogs = document.getElementById('adminTabLogs');

    [tabDonateBtn, tabUsersBtn, tabLogsBtn].forEach(b => b && b.classList.remove('active'));
    [adminTabDonates, adminTabUsers, adminTabLogs].forEach(t => t && (t.style.display = 'none'));

    if (tabName === 'donates') {
        if (tabDonateBtn) tabDonateBtn.classList.add('active');
        if (adminTabDonates) adminTabDonates.style.display = 'block';
    } else if (tabName === 'users') {
        if (tabUsersBtn) tabUsersBtn.classList.add('active');
        if (adminTabUsers) adminTabUsers.style.display = 'block';
    } else if (tabName === 'logs') {
        if (tabLogsBtn) tabLogsBtn.classList.add('active');
        if (adminTabLogs) adminTabLogs.style.display = 'block';
    }
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
            <button class="btn-admin-reject" style="margin-left:4px;" onclick="handleDeleteUser('${u.id}', '${u.username}')">🗑️ Xóa</button>
        `;

        html += `
            <tr>
                <td><strong>${u.username}</strong> ${isAdmin ? '<span class="badge-status status-approved">ADMIN</span>' : ''}</td>
                <td>${u.email || u.username + '@gmail.com'}</td>
                <td><code style="color:#ffd700;">${u.refCode}</code></td>
                <td><strong style="color:#ffd700; font-size:1.05rem;">${u.coins} Xu</strong></td>
                <td>
                    <div style="display:flex; gap:6px; flex-wrap:wrap;">
                        <button class="btn-admin-adjust" onclick="openAdjustCoinsModal('${u.id}', '${u.username}', ${u.coins})">⚙️ Sửa Xu</button>
                        <button class="btn-admin-adjust" style="background:linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color:#fff; border:none;" onclick="openAdminResetPasswordModal('${u.id}', '${u.username}')">🔑 Đổi Mật Khẩu</button>
                        ${deleteBtnHtml}
                    </div>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

function handleDeleteUser(userId, username) {
    showAdminConfirm(`Xác nhận XÓA vĩnh viễn tài khoản thành viên (${username}) khỏi hệ thống?`, () => {
        const res = AuthStore.deleteUser(userId);
        showAdminAlert(res.message, () => {
            loadAdminDashboardData();
        });
    });
}

// TÙY CHỈNH XU MÔ HÌNH POPUP
function openAdjustCoinsModal(userId, username, currentCoins) {
    currentAdjustUserId = userId;

    document.getElementById('adjustTargetUsername').textContent = username;
    document.getElementById('adjustCurrentCoins').textContent = `${currentCoins} Xu`;
    document.getElementById('adjustCoinAmountInput').value = 5;

    switchAdjustTab('add');
    document.getElementById('adminAdjustCoinsModal').classList.add('active');
}

// ĐẶT LẠI MẬT KHẨU CHO THÀNH VIÊN
function openAdminResetPasswordModal(userId, username) {
    currentResetUserId = userId;

    document.getElementById('resetTargetUsername').textContent = username;
    const input = document.getElementById('adminNewPasswordInput');
    if (input) input.value = '';

    document.getElementById('adminResetPasswordModal').classList.add('active');
}

function submitAdminResetPassword() {
    const input = document.getElementById('adminNewPasswordInput');
    if (!input || !input.value.trim()) {
        showAdminAlert("Vui lòng nhập mật khẩu mới!");
        return;
    }

    const newPass = input.value.trim();
    const res = AuthStore.adminResetUserPassword(currentResetUserId, newPass);

    document.getElementById('adminResetPasswordModal').classList.remove('active');

    showAdminAlert(res.message, () => {
        loadAdminDashboardData();
    });
}

function switchAdjustTab(mode) {
    currentAdjustMode = mode;
    const tabAdd = document.getElementById('tabAdjustAdd');
    const tabSub = document.getElementById('tabAdjustSub');
    const presetBox = document.getElementById('adjustPresetButtons');

    if (mode === 'add') {
        if (tabAdd) tabAdd.classList.add('active');
        if (tabSub) tabSub.classList.remove('active');
    } else {
        if (tabSub) tabSub.classList.add('active');
        if (tabAdd) tabAdd.classList.remove('active');
    }

    const presets = [2, 5, 10, 20, 50];
    let presetsHtml = '';
    presets.forEach(p => {
        presetsHtml += `
            <button type="button" class="admin-tab-btn" style="padding:4px 10px; font-size:0.8rem;" onclick="document.getElementById('adjustCoinAmountInput').value = ${p}">
                ${mode === 'add' ? '+' : '-'}${p} Xu
            </button>
        `;
    });
    if (presetBox) presetBox.innerHTML = presetsHtml;
}

function submitAdjustCoins() {
    if (!currentAdjustUserId) return;

    const val = parseInt(document.getElementById('adjustCoinAmountInput').value) || 0;
    if (val <= 0) {
        showAdminAlert("Vui lòng nhập số Xu lớn hơn 0!");
        return;
    }

    const coinDelta = (currentAdjustMode === 'add') ? val : -val;
    const actionLabel = (currentAdjustMode === 'add') ? `Admin cộng +${val} Xu` : `Admin trừ ${val} Xu`;

    const res = AuthStore.adminAdjustCoins(currentAdjustUserId, coinDelta, actionLabel);

    document.getElementById('adminAdjustCoinsModal').classList.remove('active');

    showAdminAlert(res.message, () => {
        loadAdminDashboardData();
    });
}

// THỐNG KÊ LỊCH SỬ TRA CỨU TÊN USER THỰC TẾ
function renderLogsList() {
    if (typeof AuthStore === 'undefined') return;

    const logsStr = localStorage.getItem('sim_pt_coin_logs_v1');
    let logs = [];
    try {
        logs = JSON.parse(logsStr) || [];
    } catch (e) {}

    const users = AuthStore.getUsers();
    const userMap = {};
    users.forEach(u => {
        userMap[u.id] = u.username;
    });

    const tbody = document.getElementById('logsTableBody');
    if (!tbody) return;

    if (logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#94a3b8;">Chưa có nhật ký giao dịch nào.</td></tr>`;
        return;
    }

    let html = '';
    logs.forEach(l => {
        const timeStr = new Date(l.timestamp).toLocaleString('vi-VN');

        let displayUsername = l.username;
        if (!displayUsername || displayUsername === 'Khách' || displayUsername.startsWith('usr_')) {
            if (l.userId && userMap[l.userId]) {
                displayUsername = userMap[l.userId];
            }
        }

        const changeHtml = (l.change >= 0) 
            ? `<strong style="color:#4ade80;">+${l.change} Xu</strong>` 
            : `<strong style="color:#f87171;">${l.change} Xu</strong>`;

        html += `
            <tr>
                <td>${timeStr}</td>
                <td><strong>${displayUsername || 'Khách'}</strong></td>
                <td>${l.action}</td>
                <td>${changeHtml}</td>
                <td><span style="color:#ffd700;">${l.balanceAfter} Xu</span></td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// MODAL UTILS
function showAdminAlert(message, callback = null) {
    const msgElem = document.getElementById('adminAlertMsg');
    if (msgElem) msgElem.innerHTML = message.replace(/\n/g, '<br/>');

    const modal = document.getElementById('adminAlertModal');
    if (modal) modal.classList.add('active');

    const btnOk = document.getElementById('btnAdminAlertOk');
    if (btnOk) {
        btnOk.onclick = () => {
            modal.classList.remove('active');
            if (callback) callback();
        };
    }
}

function showAdminConfirm(message, onYesCallback) {
    const msgElem = document.getElementById('adminConfirmMsg');
    if (msgElem) msgElem.innerHTML = message.replace(/\n/g, '<br/>');

    const modal = document.getElementById('adminConfirmModal');
    if (modal) modal.classList.add('active');

    const btnYes = document.getElementById('btnAdminConfirmYes');
    const btnNo = document.getElementById('btnAdminConfirmNo');

    if (btnYes) {
        btnYes.onclick = () => {
            modal.classList.remove('active');
            if (onYesCallback) onYesCallback();
        };
    }

    if (btnNo) {
        btnNo.onclick = () => {
            modal.classList.remove('active');
        };
    }
}

function setupAdminModalEvents() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    });
}

// LẮNG NGHE ĐỒNG BỘ REALTIME GIỮA CÁC TAB KHI XU HOẶC THÀNH VIÊN THAY ĐỔI
window.addEventListener('storage', (e) => {
    if (e.key === 'sim_pt_users_v1' || e.key === 'sim_pt_current_user_v1' || e.key === 'sim_pt_donate_requests_v1' || e.key === 'sim_pt_coin_logs_v1') {
        if (typeof loadAdminDashboardData === 'function') loadAdminDashboardData();
    }
});
