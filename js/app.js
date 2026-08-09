/* ==========================================================================
   MAIN UI CONTROLLER - Website Sim Phong Thủy Lục Hào Pro
   - Tự động chuyển Chữ Hoa cho Mã Giới Thiệu & Chữ Thường cho Tên Đăng Nhập
   - Custom Modal Quên Mật Khẩu Đẹp Sang Trọng (Không dùng prompt trình duyệt)
   - Đổi Mật Khẩu Admin thành 140498 & hỗ trợ email dambuicong@gmail.com
   - Nút X Popup Quẻ Lục Hào Hoạt Động 100%
   - Nút Tải QR ẩn trên máy tính, chỉ hiển thị trên Điện Thoại (Mã QR to 240px)
   ========================================================================== */

let currentResults = [];
let currentSimEvalItem = null;
let pendingAction = null;
let selectedDonateTierKey = '50k';

document.addEventListener('DOMContentLoaded', () => {
    initFormDefaults();
    setupDigitBoxes();
    setupFormEvents();
    setupModalEvents();
    setupCurrentSimEval();
    setupAuthAndCommerce();
    setupInputTransforms();
    detectRefQuery();
});

function isMobileDevice() {
    return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function initFormDefaults() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now.getTime() - offset)).toISOString().slice(0, 16);

    const dateInput = document.getElementById('birthDate');
    if (dateInput) {
        dateInput.value = localISOTime;
    }

    const limitSelect = document.getElementById('limitSelect');
    const btnSubmitSearch = document.getElementById('btnSubmitSearch');

    if (limitSelect && btnSubmitSearch) {
        const updateSubmitBtnText = () => {
            const val = parseInt(limitSelect.value) || 5;
            let cost = 2;
            if (val === 5) cost = 2;
            if (val === 15) cost = 6;
            if (val === 30) cost = 12;
            if (val === 50) cost = 20;

            btnSubmitSearch.innerHTML = `🔮 Gợi Ý SIM Số Đẹp (${cost} Xu)`;
        };

        limitSelect.addEventListener('change', updateSubmitBtnText);
        updateSubmitBtnText(); // Tự động cập nhật ngay khi trang vừa load xong
    }
}

// TỰ ĐỘNG BIẾN ĐỔI CHỮ HOA MÃ GIỚI THIỆU & CHỮ THƯỜNG TÊN TÀI KHOẢN
function setupInputTransforms() {
    const uppercaseInputs = ['regRefCode', 'inputApplyRefCode'];
    uppercaseInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', function() {
                this.value = this.value.toUpperCase();
            });
        }
    });

    const lowercaseInputs = ['loginUsername', 'regUsername', 'forgotInput'];
    lowercaseInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', function() {
                this.value = this.value.toLowerCase();
            });
        }
    });
}

// THƯƠNG MẠI HÓA & AUTH STORE UI SYNC
function setupAuthAndCommerce() {
    updateUserNavUI();

    const btnOpenAuth = document.getElementById('btnOpenAuth');
    if (btnOpenAuth) btnOpenAuth.addEventListener('click', () => openModal('authModal'));

    const btnEarnCoins = document.getElementById('btnEarnCoins');
    if (btnEarnCoins) btnEarnCoins.addEventListener('click', () => openDonateModal());

    const btnShowCoinHistory = document.getElementById('btnShowCoinHistory');
    if (btnShowCoinHistory) btnShowCoinHistory.addEventListener('click', () => openUserCoinHistoryModal());

    const btnShowRefModal = document.getElementById('btnShowRefModal');
    if (btnShowRefModal) btnShowRefModal.addEventListener('click', () => openRefModal());

    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            if (e) e.preventDefault();
            AuthStore.logout();
            updateUserNavUI();
            showToast("Đã đăng xuất tài khoản!");
        });
    }

    const adminLinkBtn = document.getElementById('adminLinkBtn');
    if (adminLinkBtn) {
        adminLinkBtn.addEventListener('click', (e) => {
            if (e) e.preventDefault();
            window.location.href = 'admin/index.html';
        });
    }

    // Form Đăng Nhập
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const u = document.getElementById('loginUsername').value;
            const p = document.getElementById('loginPassword').value;

            const res = AuthStore.login(u, p);
            if (res.success) {
                closeModal('authModal');
                updateUserNavUI();
                showToast(res.message);
                if (pendingAction) {
                    executePendingActionWithConfirm();
                }
            } else {
                showToast(res.message);
            }
        });
    }

    // Nút Mở Modal Quên Mật Khẩu Custom (Đã sửa hoạt động 100%)
    const btnOpenForgotPasswordModal = document.getElementById('btnOpenForgotPasswordModal');
    if (btnOpenForgotPasswordModal) {
        btnOpenForgotPasswordModal.addEventListener('click', (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            closeModal('authModal');
            setTimeout(() => {
                const resultBox = document.getElementById('forgotResultBox');
                if (resultBox) resultBox.style.display = 'none';
                openModal('forgotPasswordModal');
            }, 60);
        });
    }

    // Submit Form Quên Mật Khẩu
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const inputVal = document.getElementById('forgotInput').value.trim();
            const resultBox = document.getElementById('forgotResultBox');

            if (!inputVal) return;

            const res = AuthStore.requestPasswordReset(inputVal);

            if (resultBox) {
                resultBox.style.display = 'block';
                if (res.success) {
                    resultBox.style.background = 'rgba(34, 197, 94, 0.15)';
                    resultBox.style.border = '1px solid #16a34a';
                    resultBox.style.color = '#4ade80';
                } else {
                    resultBox.style.background = 'rgba(239, 68, 68, 0.15)';
                    resultBox.style.border = '1px solid #ef4444';
                    resultBox.style.color = '#f87171';
                }
                resultBox.textContent = res.message;
            }

            showToast(res.message);
        });
    }

    // Form Đăng Ký
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const u = document.getElementById('regUsername').value;
            const p = document.getElementById('regPassword').value;
            const ref = document.getElementById('regRefCode').value;

            const res = AuthStore.register(u, `${u}@gmail.com`, p, ref);
            if (res.success) {
                closeModal('authModal');
                updateUserNavUI();
                showToast(res.message);
                if (pendingAction) {
                    executePendingActionWithConfirm();
                }
            } else {
                showToast(res.message);
            }
        });
    }

    // NÚT BẤM BỔ SUNG MÃ GIỚI THIỆU
    const btnApplyRefCode = document.getElementById('btnApplyRefCode');
    if (btnApplyRefCode) {
        btnApplyRefCode.addEventListener('click', () => {
            const user = AuthStore.getCurrentUser();
            if (!user) {
                openModal('authModal');
                return;
            }

            const inputRef = document.getElementById('inputApplyRefCode').value;
            const res = AuthStore.applyReferralCode(user.id, inputRef);

            showToast(res.message);
            if (res.success) {
                updateUserNavUI();
                openRefModal();
            }
        });
    }

    // Submit Donate Request
    const btnSubmitDonateReq = document.getElementById('btnSubmitDonateReq');
    if (btnSubmitDonateReq) {
        btnSubmitDonateReq.addEventListener('click', () => {
            const user = AuthStore.getCurrentUser();
            if (!user) {
                openModal('authModal');
                return;
            }

            const res = AuthStore.createDonateRequest(user.id, selectedDonateTierKey);
            showToast(res.message);
            if (res.success) {
                closeModal('donateModal');
            }
        });
    }

    // TẢI / CHIA SẺ MÃ QR DONATE THANH TOÁN NGÂN HÀNG (CHỈ CHẠY KHI BẤM Ở DI ĐỘNG)
    const btnDownloadDonateQr = document.getElementById('btnDownloadDonateQr');
    if (btnDownloadDonateQr) {
        btnDownloadDonateQr.addEventListener('click', () => {
            handleDownloadDonateQr();
        });
    }

    // Confirm Deduct Coins Action
    const btnConfirmDeductAction = document.getElementById('btnConfirmDeductAction');
    if (btnConfirmDeductAction) {
        btnConfirmDeductAction.addEventListener('click', () => {
            if (!pendingAction) return;

            const user = AuthStore.getCurrentUser();
            if (!user) {
                closeModal('confirmDeductModal');
                openModal('authModal');
                return;
            }

            const res = AuthStore.deductCoins(user.id, pendingAction.cost, pendingAction.actionName);
            if (res.success) {
                closeModal('confirmDeductModal');
                updateUserNavUI();
                showToast(`Đã trừ ${pendingAction.cost} Xu. Đang xử lý quẻ...`);

                const act = pendingAction.type;
                pendingAction = null;

                if (act === 'evalCurrent') {
                    executeEvalCurrentSim();
                } else if (act === 'searchSims') {
                    executeSearchSims();
                }
            } else {
                closeModal('confirmDeductModal');
                showToast(res.message);
                openDonateModal();
            }
        });
    }

    // Copy Referral Link
    const btnCopyRefLink = document.getElementById('btnCopyRefLink');
    if (btnCopyRefLink) {
        btnCopyRefLink.addEventListener('click', () => {
            const user = AuthStore.getCurrentUser();
            if (!user) return;
            const origin = (window.location.origin && window.location.origin.includes('simphongthuy.io.vn')) 
                ? 'http://simphongthuy.io.vn' 
                : window.location.origin;
            const url = `${origin}/?ref=${user.refCode}`;
            copySimNumberOnly(url);
        });
    }
}

// XỬ LÝ TẢI / CHIA SẺ MÃ QR DONATE TRÊN ĐIỆN THOẠI
function handleDownloadDonateQr() {
    const qrImg = document.getElementById('donateQrImg');
    if (!qrImg || !qrImg.src) return;

    const imgSrc = qrImg.src;
    const filename = `ma-qr-donate-${selectedDonateTierKey}-${Date.now()}.jpg`;

    fetch(imgSrc)
        .then(res => res.blob())
        .then(blob => {
            const file = new File([blob], filename, { type: 'image/jpeg' });

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                navigator.share({
                    files: [file],
                    title: `Mã QR Donate Ngân Hàng - Gói ${selectedDonateTierKey.toUpperCase()}`,
                    text: `Mã QR Chuyển Khoản Ngân Hàng Donate Gói ${selectedDonateTierKey.toUpperCase()}`
                }).then(() => {
                    showToast("Đã chia sẻ / lưu ảnh mã QR thành công!");
                }).catch(err => {
                    if (err.name !== 'AbortError') {
                        fallbackDownloadBlob(blob, filename);
                    }
                });
            } else {
                fallbackDownloadBlob(blob, filename);
            }
        })
        .catch(() => {
            const link = document.createElement('a');
            link.href = imgSrc;
            link.download = filename;
            link.click();
            showToast("Đã tải ảnh mã QR về thiết bị!");
        });
}

// CẬP NHẬT GIAO DIỆN HEADER TÀI KHOẢN
function updateUserNavUI() {
    const user = AuthStore.getCurrentUser();
    const guestNav = document.getElementById('guestUserNav');
    const loggedInNav = document.getElementById('loggedInUserNav');
    const coinSpan = document.getElementById('userCoinBalance');
    const refCodeSpan = document.getElementById('userRefCode');
    const adminLinkBtn = document.getElementById('adminLinkBtn');

    if (!user) {
        if (guestNav) guestNav.style.display = 'flex';
        if (loggedInNav) loggedInNav.style.display = 'none';
    } else {
        if (guestNav) guestNav.style.display = 'none';
        if (loggedInNav) loggedInNav.style.display = 'flex';

        let actualCoins = user.coins;
        const logs = AuthStore.getUserLogs(user.id);
        if (logs && logs.length > 0 && logs[0].balanceAfter !== undefined) {
            actualCoins = logs[0].balanceAfter;
        }

        if (coinSpan) coinSpan.textContent = actualCoins;
        if (refCodeSpan) refCodeSpan.textContent = user.refCode || '---';

        if (adminLinkBtn) {
            adminLinkBtn.style.display = (user.username === 'dambuicong' || user.isAdmin) ? 'inline-block' : 'none';
        }
    }
}

// MỞ POPUP LỊCH SỬ TIÊU DÙNG XU KHÁCH HÀNG (CĂN GIỮA NỘI DUNG THAO TÁC CỰC CHUẨN)
function openUserCoinHistoryModal() {
    const user = AuthStore.getCurrentUser();
    if (!user) {
        openModal('authModal');
        return;
    }

    const logs = AuthStore.getUserLogs(user.id);

    // Tự động lấy số dư chính xác 100% từ log mới nhất hoặc user.coins
    let actualCoins = user.coins;
    if (logs && logs.length > 0 && logs[0].balanceAfter !== undefined) {
        actualCoins = logs[0].balanceAfter;
    }

    const histBalanceEl = document.getElementById('histCurrentBalance');
    if (histBalanceEl) {
        histBalanceEl.textContent = `${actualCoins} Xu`;
    }

    // Cập nhật cả số dư trên thanh Header Nav
    const userCoinBalanceEl = document.getElementById('userCoinBalance');
    if (userCoinBalanceEl) {
        userCoinBalanceEl.textContent = actualCoins;
    }

    const tbody = document.getElementById('userCoinHistoryTableBody');
    if (!tbody) return;

    if (logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:24px; color:#94a3b8;">Chưa có lịch sử tiêu dùng Xu.</td></tr>`;
    } else {
        let html = '';
        logs.forEach(l => {
            const dt = new Date(l.timestamp);
            const timeStr = dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const dateStr = dt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
            const formattedTime = `<div style="font-weight:700; font-size:0.82rem; color:#f1f5f9; white-space:nowrap; text-align:center;">${timeStr}</div><div style="font-size:0.75rem; color:#94a3b8; white-space:nowrap; text-align:center;">${dateStr}</div>`;

            const cleanAction = (l.action || '').replace(/Nạp Xu/gi, '').trim();

            const changeBadge = l.change >= 0 
                ? `<span style="color:#4ade80; font-weight:800; font-size:0.9rem; white-space:nowrap;">+${l.change} Xu</span>` 
                : `<span style="color:#f87171; font-weight:800; font-size:0.9rem; white-space:nowrap;">${l.change} Xu</span>`;

            const balanceStr = `<div style="font-size:0.75rem; color:#ffd700; font-weight:bold;">(Dư ${l.balanceAfter} Xu)</div>`;

            html += `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                    <td style="padding: 10px 6px; vertical-align: middle; text-align: center;">${formattedTime}</td>
                    <td style="padding: 10px 6px; vertical-align: middle; text-align: center; color:#cbd5e1; font-size:0.86rem; line-height:1.4;">${cleanAction}</td>
                    <td style="padding: 10px 6px; vertical-align: middle; text-align: center;">
                        ${changeBadge}
                        ${balanceStr}
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    }

    openModal('userCoinHistoryModal');
}

// BẮT MÃ GIỚI THIỆU TỪ URL (?ref=CODE)
function detectRefQuery() {
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get('ref');
    if (refParam) {
        const regRefInput = document.getElementById('regRefCode');
        if (regRefInput) regRefInput.value = refParam.toUpperCase();

        const inputApplyRefCode = document.getElementById('inputApplyRefCode');
        if (inputApplyRefCode) inputApplyRefCode.value = refParam.toUpperCase();
    }
}

function openDonateModal() {
    const user = AuthStore.getCurrentUser();
    if (!user) {
        showToast("Vui lòng đăng nhập trước khi Donate!");
        openModal('authModal');
        return;
    }
    selectDonateTier('50k', 2, 50000, document.querySelector('.donate-card'));
    openModal('donateModal');
}

function selectDonateTier(tierKey, coins, amountVnd, elem) {
    selectedDonateTierKey = tierKey;

    document.querySelectorAll('.donate-card').forEach(c => c.classList.remove('active'));
    if (elem) elem.classList.add('active');

    const qrImg = document.getElementById('donateQrImg');
    const memoText = document.getElementById('donateMemoText');
    const user = AuthStore.getCurrentUser();
    const username = user ? user.username : 'KHACH';

    if (qrImg) {
        qrImg.src = `${tierKey}.jfif`;
        qrImg.alt = `QR Code Donate ${tierKey}`;
    }

    if (memoText) {
        memoText.textContent = `DONATE ${username.toUpperCase()}`;
    }
}

// MỞ MODAL MÃ GIỚI THIỆU
function openRefModal() {
    const user = AuthStore.getCurrentUser();
    if (!user) {
        openModal('authModal');
        return;
    }

    const refCodeBig = document.getElementById('refCodeBig');
    if (refCodeBig) refCodeBig.textContent = user.refCode || '---';

    const stats = AuthStore.getReferralStats(user.id);
    document.getElementById('statTotalRefs').textContent = stats.totalRefs;
    document.getElementById('statQualRefs').textContent = stats.qualifiedRefs;
    document.getElementById('statTotalEarned').textContent = stats.totalEarned;

    // Kiểm tra đã áp dụng Mã GT chưa
    const refApplySection = document.getElementById('refApplySection');
    const refAppliedBadge = document.getElementById('refAppliedBadge');
    const refAppliedName = document.getElementById('refAppliedName');

    if (stats.referredBy || user.referredBy) {
        if (refApplySection) refApplySection.style.display = 'none';
        if (refAppliedBadge) {
            refAppliedBadge.style.display = 'block';
            if (refAppliedName) refAppliedName.textContent = stats.referrerName || 'Người Giới Thiệu';
        }
    } else {
        if (refApplySection) refApplySection.style.display = 'block';
        if (refAppliedBadge) refAppliedBadge.style.display = 'none';
    }

    openModal('refModal');
}

function switchAuthTab(tab) {
    const tabLoginBtn = document.getElementById('tabLoginBtn');
    const tabRegisterBtn = document.getElementById('tabRegisterBtn');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (tab === 'login') {
        tabLoginBtn.classList.add('active');
        tabRegisterBtn.classList.remove('active');
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        tabRegisterBtn.classList.add('active');
        tabLoginBtn.classList.remove('active');
        registerForm.style.display = 'block';
        loginForm.style.display = 'none';
    }
}

function setupDigitBoxes() {
    const boxes = Array.from(document.querySelectorAll('.digit-box:not(.fixed-zero)'));

    boxes.forEach((box, idx) => {
        box.addEventListener('input', (e) => {
            const val = e.target.value;
            e.target.value = val.replace(/[^0-9]/g, '');

            if (e.target.value.length >= 1) {
                e.target.value = e.target.value.slice(-1);
                if (idx < boxes.length - 1) {
                    boxes[idx + 1].focus();
                }
            }
        });

        box.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value) {
                if (idx > 0) {
                    boxes[idx - 1].focus();
                }
            }
        });

        box.addEventListener('focus', (e) => {
            e.target.select();
        });
    });

    const prefixSelect = document.getElementById('prefixSelect');
    if (prefixSelect) {
        prefixSelect.addEventListener('change', (e) => {
            const prefix = e.target.value;
            if (!prefix) return;

            const digit2 = document.getElementById('digit-2');
            const digit3 = document.getElementById('digit-3');

            if (prefix.length >= 2 && digit2) digit2.value = prefix[1] || '';
            if (prefix.length >= 3 && digit3) digit3.value = prefix[2] || '';
        });
    }
}

function getFormInputs() {
    const birthDateVal = document.getElementById('birthDate')?.value || '';
    const genderRadio = document.querySelector('input[name="genderRadio"]:checked');
    const genderSelect = document.getElementById('gender');
    const gender = genderRadio ? genderRadio.value : (genderSelect ? genderSelect.value : 'male');
    const purpose = document.getElementById('purpose')?.value || document.getElementById('purposeSelect')?.value || 'cautai';
    const limitVal = parseInt(document.getElementById('limitSelect')?.value) || 5;

    return { birthDateVal, gender, purpose, limitVal };
}

function setupFormEvents() {
    const btnSubmitSearch = document.getElementById('btnSubmitSearch');
    const form = document.getElementById('simForm');

    const handleSearch = (e) => {
        if (e) e.preventDefault();

        const user = AuthStore.getCurrentUser();
        if (!user) {
            showToast("Vui lòng đăng nhập để gợi ý SIM!");
            openModal('authModal');
            return;
        }

        const { birthDateVal } = getFormInputs();
        if (!birthDateVal) {
            showToast("Vui lòng chọn ngày & giờ sinh!");
            return;
        }

        const { limitVal } = getFormInputs();
        let cost = 2;
        if (limitVal === 5) cost = 2;
        if (limitVal === 15) cost = 6;
        if (limitVal === 30) cost = 12;
        if (limitVal === 50) cost = 20;

        pendingAction = {
            type: 'searchSims',
            cost,
            actionName: `Gợi ý Top ${limitVal} SIM Đại Cát`
        };

        executePendingActionWithConfirm();
    };

    if (btnSubmitSearch) btnSubmitSearch.addEventListener('click', handleSearch);
    if (form) form.addEventListener('submit', handleSearch);
}

function setupCurrentSimEval() {
    const btn = document.getElementById('btnEvalCurrentSim');
    if (!btn) return;

    btn.addEventListener('click', () => {
        const user = AuthStore.getCurrentUser();
        if (!user) {
            showToast("Vui lòng đăng nhập để đánh giá SIM!");
            openModal('authModal');
            return;
        }

        const { birthDateVal } = getFormInputs();
        if (!birthDateVal) {
            showToast("Vui lòng chọn ngày & giờ sinh trước!");
            return;
        }

        const inputEl = document.getElementById('currentSimInput') || document.getElementById('evalCurrentSim');
        const inputSim = inputEl ? inputEl.value.trim() : '';
        const rawSim = inputSim.replace(/[^0-9]/g, '');

        if (!rawSim || rawSim.length !== 10) {
            showToast("Vui lòng nhập SĐT đang dùng hợp lệ chuẩn 10 chữ số!");
            return;
        }

        pendingAction = {
            type: 'evalCurrent',
            cost: 2,
            actionName: `Đánh Giá SIM Đang Dùng (${formatSimNumber(rawSim)})`
        };

        executePendingActionWithConfirm();
    });
}

function executePendingActionWithConfirm() {
    if (!pendingAction) return;

    const user = AuthStore.getCurrentUser();
    if (!user) {
        openModal('authModal');
        return;
    }

    if (user.coins < pendingAction.cost) {
        showToast(`Số dư không đủ! Bạn cần ${pendingAction.cost} Xu.`);
        openDonateModal();
        return;
    }

    const confirmActionName = document.getElementById('confirmDeductActionName');
    const confirmCost = document.getElementById('confirmDeductCost');
    const confirmBalance = document.getElementById('confirmDeductBalance');

    if (confirmActionName) confirmActionName.textContent = `Thao tác: ${pendingAction.actionName}`;
    if (confirmCost) confirmCost.textContent = `${pendingAction.cost} Xu`;
    if (confirmBalance) confirmBalance.textContent = `${user.coins} Xu`;

    openModal('confirmDeductModal');
}

function executeEvalCurrentSim() {
    const inputEl = document.getElementById('currentSimInput') || document.getElementById('evalCurrentSim');
    const inputSim = inputEl ? inputEl.value.trim() : '';
    const rawSim = inputSim.replace(/[^0-9]/g, '');
    const { birthDateVal, gender, purpose } = getFormInputs();

    const cal = calculateCanChi(birthDateVal);
    const hexData = calculateSimHexagram(rawSim, cal);

    if (!hexData) {
        showToast("Không thể lập quẻ từ dãy số này!");
        return;
    }

    const evaluation = evaluateSimFengShui(rawSim, hexData, cal, purpose, gender);

    const currentSimArea = document.getElementById('currentSimResultArea') || document.getElementById('currentSimResultBox');
    const formattedSim = formatSimNumber(rawSim);
    currentSimEvalItem = { sim: rawSim, hexData, evaluation };

    if (currentSimArea) {
        currentSimArea.style.display = 'block';
        currentSimArea.innerHTML = `
            <div class="sim-card" style="border: 2px solid var(--gold-dark); background: #1a2438; margin-top: 14px;">
                <div class="sim-info">
                    <div style="font-size: 0.95rem; color: var(--gold-primary); font-weight: bold; margin-bottom: 4px;">
                        📲 KẾT QUẢ ĐÁNH GIÁ SIM ĐANG DÙNG:
                    </div>
                    <div class="sim-number-display" style="font-size: 1.8rem;">
                        <span class="highlight">${formattedSim}</span>
                    </div>

                    <div class="sim-badge-group">
                        <span class="badge badge-score">${evaluation.score}/100 - ${evaluation.grade}</span>
                        <span class="badge badge-hex">Quẻ Chủ: ${hexData.mainName} → ${hexData.changedName}</span>
                    </div>

                    <ul class="sim-reasons-list">
                        ${evaluation.reasons.map(r => `<li>${r}</li>`).join('')}
                    </ul>
                </div>

                <div class="sim-actions">
                    <button class="btn-action btn-view-hex" onclick="handleCurrentSimDetail()">
                        🔍 Xem Chi Tiết
                    </button>
                </div>
            </div>
        `;

        currentSimArea.scrollIntoView({ behavior: 'smooth' });
    }
}

function executeSearchSims() {
    const { birthDateVal, gender, purpose, limitVal } = getFormInputs();

    let pattern = '0';
    for (let i = 2; i <= 10; i++) {
        const el = document.getElementById(`digit-${i}`);
        const val = el ? el.value.trim() : '';
        pattern += val ? val : '*';
    }

    const resultsContainer = document.getElementById('resultsContainer');
    if (resultsContainer) {
        resultsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--gold-primary);">
                <div class="spinner" style="font-size: 2rem; margin-bottom: 10px;">🔮</div>
                <p style="font-size: 1.1rem; font-weight: 600;">Đang lập quẻ Lục Hào & Tính toán Top ${limitVal} SIM Cát Tường...</p>
            </div>
        `;
    }

    setTimeout(() => {
        currentResults = generateMatchingSims(pattern, birthDateVal, gender, purpose, limitVal);
        renderResults(currentResults);
    }, 150);
}

function renderResults(results) {
    const resultsContainer = document.getElementById('resultsContainer');
    const resultsHeader = document.getElementById('resultsHeader');

    if (!results || results.length === 0) {
        if (resultsHeader) resultsHeader.style.display = 'none';
        resultsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border-gold);">
                <p style="font-size: 1.2rem; color: #f87171; font-weight: 600;">Không tìm thấy dãy số phù hợp đạt điều kiện Lục Hào Cát Tường.</p>
                <p style="color: var(--text-muted); margin-top: 8px;">Gợi ý: Hãy thử bỏ bớt các chữ số cố định (để ô trống) để hệ thống có nhiều lựa chọn phối số hơn.</p>
            </div>
        `;
        return;
    }

    if (resultsHeader) {
        resultsHeader.style.display = 'flex';
        document.getElementById('resultCount').textContent = `${results.length} số Đại Cát`;
    }

    let html = '<div class="sim-list">';

    results.forEach((item, index) => {
        const formattedSim = formatSimNumber(item.sim);
        const { score, grade, reasons } = item.evaluation;
        const hex = item.hexData;

        html += `
            <div class="sim-card">
                <div class="sim-info">
                    <div class="sim-number-display">
                        ${index + 1}. <span class="highlight">${formattedSim}</span>
                    </div>

                    <div class="sim-badge-group">
                        <span class="badge badge-score">${score}/100 - ${grade}</span>
                        <span class="badge badge-hex">Quẻ Chủ: ${hex.mainName} → ${hex.changedName}</span>
                    </div>

                    <ul class="sim-reasons-list">
                        ${reasons.map(r => `<li>${r}</li>`).join('')}
                    </ul>
                </div>

                <div class="sim-actions">
                    <button class="btn-action btn-view-hex" onclick="handleDetailClick(${index})">
                        🔍 Xem Chi Tiết
                    </button>
                    <button class="btn-action btn-copy-info" onclick="copySimNumberOnly('${formattedSim}')">
                        📋 Sao Chép
                    </button>
                </div>
            </div>
        `;
    });

    html += '</div>';
    resultsContainer.innerHTML = html;
}

function formatSimNumber(sim) {
    if (sim.length === 10) {
        return `${sim.slice(0, 4)}.${sim.slice(4, 7)}.${sim.slice(7)}`;
    }
    return sim;
}

function copySimNumberOnly(simStr) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(simStr).then(() => {
            showToast(`Đã sao chép: ${simStr}`);
        }).catch(() => fallbackCopy(simStr));
    } else {
        fallbackCopy(simStr);
    }
}

function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast(`Đã sao chép: ${text}`);
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) {
        alert(message);
        return;
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3200);
}

function renderHexVisual(lines, isChanged) {
    const bits = lines.map(v => getBit(v, isChanged));
    let html = '';

    for (let i = 5; i >= 0; i--) {
        const isMoving = (lines[i] === 0 || lines[i] === 3);
        const moveClass = isMoving ? 'moving' : '';
        html += `<div class="gua-line ${bits[i] === '1' ? 'yang' : 'yin'} ${moveClass}"></div>`;
    }

    return `<div class="gua-container">${html}</div>`;
}

function handleDetailClick(index) {
    const item = currentResults[index];
    if (!item) return;
    openHexModalDesktopObject(item);
}

function handleCurrentSimDetail() {
    if (!currentSimEvalItem) return;
    openHexModalDesktopObject(currentSimEvalItem);
}

function buildHexCardHTML(item) {
    const { hexData, sim, evaluation } = item;

    let rowsHtml = '';
    for (let i = 5; i >= 0; i--) {
        const line = hexData.linesData[i];
        const rowClass = line.isMoving ? 'row-moving' : 'row-static';

        let sym = (line.val === 1) ? '—' : (line.val === 2) ? '--' : (line.val === 3) ? 'O' : 'X';

        let sy = '';
        if (line.isShi) sy = `<span class="marker-the">Thế</span>`;
        if (line.isYing) sy = `<span class="marker-ung">Ứng</span>`;

        let phucHtml = '-';
        if (line.phucThan) {
            phucHtml = `<span class="phuc-than">${line.phucThan.rel} - ${line.phucThan.branch}</span>`;
        }

        const isTK = line.isTK ? 'K' : '-';
        const isCTK = line.isCTK ? 'K' : '-';

        rowsHtml += `
            <tr class="${rowClass}">
                <td>${sym}</td>
                <td>${sy}</td>
                <td>${line.relation}</td>
                <td>${line.chi}-${line.hanh}</td>
                <td>${phucHtml}</td>
                <td>${isTK}</td>
                <td class="sep-col">${line.changed.relation}</td>
                <td>${line.changed.branch}-${line.changed.hanh}</td>
                <td>${line.lucThu}</td>
                <td>${isCTK}</td>
                <td>${line.tsNgay}</td>
                <td>${line.tsThang}</td>
            </tr>
        `;
    }

    const purposeSelect = document.getElementById('purposeSelect');
    const purposeText = purposeSelect ? purposeSelect.options[purposeSelect.selectedIndex].text : '';

    return `
        <div id="hexCardCapture" class="hex-card-view">
            <!-- Header Thông Tin -->
            <div class="info-header">
                <div class="info-content">
                    <div class="info-line"><strong>SIM Chọn:</strong> <span class="highlight" style="font-size:18px;">${formatSimNumber(sim)}</span></div>
                    <div class="info-line"><strong>Mục đích cầu:</strong> ${purposeText}</div>
                    <div class="info-line"><strong>Tuần Không:</strong> <span class="highlight">${hexData.dateInfo.tuanKhong}</span></div>
                    <div class="info-line">
                        <strong>Nhật Thần:</strong> <span class="highlight">${hexData.dateInfo.nhatThan}</span> &nbsp;&nbsp;&nbsp;&nbsp; 
                        <strong>Nguyệt Lệnh:</strong> <span class="highlight">${hexData.dateInfo.nguyetLenh}</span>
                    </div>
                </div>
            </div>

            <!-- 3 Cột vẽ hình Hào Quẻ Chủ - Quẻ Hỗ - Quẻ Biến -->
            <div class="hex-visual-section">
                <div class="hex-box">
                    <div class="hex-title">${hexData.mainName}</div>
                    ${renderHexVisual(hexData.lines, false)}
                    <div class="hex-family">Họ ${hexData.palaceName}${hexData.mainAttr ? ' - ' + hexData.mainAttr : ''}</div>
                </div>

                ${hexData.hoData ? `
                <div class="hex-box">
                    <div class="hex-title">${hexData.hoData.name}</div>
                    ${renderHexVisual(hexData.hoData.lines, false)}
                    <div class="hex-family">Họ ${hexData.hoData.palaceName}${hexData.hoData.attr ? ' - ' + hexData.hoData.attr : ''}</div>
                    ${hexData.ngamResult && hexData.ngamResult.length > 0 ? `<div style="font-size:14px; font-weight:bold; margin-top:4px;">${hexData.ngamResult.join(', ')}</div>` : ''}
                </div>` : ''}

                <div class="hex-box">
                    <div class="hex-title">${hexData.changedName}</div>
                    ${renderHexVisual(hexData.lines, true)}
                    <div class="hex-family">Họ ${hexData.changedPalaceName}${hexData.changedAttr ? ' - ' + hexData.changedAttr : ''}</div>
                </div>
            </div>

            <!-- Bảng Lục Hào 12 Cột -->
            <table>
                <thead>
                    <tr>
                        <th>Hào</th>
                        <th>T/Ư</th>
                        <th>Lục Thân</th>
                        <th>Can Chi</th>
                        <th>P.Thần</th>
                        <th>TK</th>
                        <th class="sep-col">Lục Thân</th>
                        <th>Can Chi</th>
                        <th>Lục Thú</th>
                        <th>TK</th>
                        <th>TS Ngày</th>
                        <th>TS Tháng</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>

            <!-- Đánh giá Phong Thủy Chi Tiết -->
            <div class="eval-box">
                <h4>🎯 Đánh giá Cát Tường: ${evaluation.score}/100 - ${evaluation.grade}</h4>
                <ul>
                    ${evaluation.reasons.map(r => `<li>${r}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
}

function openHexModalDesktopObject(item) {
    if (!item) return;

    const modal = document.getElementById('hexModal');
    const modalBody = document.getElementById('modalBody');
    const isMobile = isMobileDevice();

    modalBody.innerHTML = `
        <div style="text-align:center; padding:20px; color:#888;">
            <div style="font-size:1.8rem; margin-bottom:8px;">🔮</div>
            Đang tạo ảnh lá quẻ sắc nét...
        </div>
    `;
    openModal('hexModal');

    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = '900px';
    tempContainer.innerHTML = buildHexCardHTML(item);
    document.body.appendChild(tempContainer);

    setTimeout(() => {
        const cardElem = tempContainer.querySelector('#hexCardCapture');
        html2canvas(cardElem, {
            scale: 2,
            useCORS: true,
            scrollX: 0,
            scrollY: 0,
            windowWidth: 960
        }).then(canvas => {
            const dataUrl = canvas.toDataURL('image/png');
            document.body.removeChild(tempContainer);

            let bottomHtml = '';
            if (isMobile) {
                bottomHtml = `
                    <button id="btnMobileShareTrigger" class="btn-mobile-share-ios">
                        📤 Chia Sẻ / Lưu Ảnh Về Điện Thoại
                    </button>
                `;
            } else {
                bottomHtml = `
                    <div class="desktop-img-hint">
                        💡 <strong>Mẹo:</strong> Nhấp chuột phải vào ảnh để <em>Sao chép hình ảnh</em> hoặc <em>Lưu hình ảnh thành...</em>
                    </div>
                `;
            }

            modalBody.innerHTML = `
                <div class="hex-card-scroll-wrapper">
                    <img src="${dataUrl}" class="hex-native-img" alt="Lá quẻ SIM ${item.sim}" />
                </div>
                ${bottomHtml}
            `;

            if (isMobile) {
                const shareBtn = document.getElementById('btnMobileShareTrigger');
                if (shareBtn) {
                    shareBtn.addEventListener('click', () => {
                        triggerDirectShareOnUserGesture(canvas, formatSimNumber(item.sim));
                    });
                }
            }
        }).catch(err => {
            console.error('html2canvas error:', err);
            document.body.removeChild(tempContainer);
            modalBody.innerHTML = buildHexCardHTML(item);
        });
    }, 100);
}

function triggerDirectShareOnUserGesture(canvas, simNumber) {
    const filename = `la-que-sim-${simNumber.replace(/[^0-9]/g, '')}-${Date.now()}.png`;

    canvas.toBlob(blob => {
        if (!blob) {
            showToast("Không thể khởi tạo file ảnh.");
            return;
        }

        const file = new File([blob], filename, { type: 'image/png' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({
                files: [file],
                title: `Lá Quẻ SIM Phong Thủy - ${simNumber}`,
                text: `Lá quẻ Dịch Học SIM Phong Thủy SĐT: ${simNumber}`
            }).then(() => {
                showToast("Đã chia sẻ / lưu ảnh thành công!");
            }).catch(err => {
                if (err.name !== 'AbortError') {
                    fallbackDownloadBlob(blob, filename);
                }
            });
        } else {
            fallbackDownloadBlob(blob, filename);
        }
    }, 'image/png');
}

function fallbackDownloadBlob(blob, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = URL.createObjectURL(blob);
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 2500);
    showToast(`Đã tải ảnh về máy thành công!`);
}

let lastCloseTime = 0;

function openModal(modalId) {
    if (Date.now() - lastCloseTime < 450) return; // Chống ghost click trên di động mở lại popup vừa tắt
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
    lastCloseTime = Date.now();
    if (typeof modalId === 'string') {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('active');
    } else if (modalId && modalId.target) {
        const modal = modalId.target.closest('.modal-overlay');
        if (modal) modal.classList.remove('active');
    } else {
        document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    }
}

window.openModal = openModal;
window.closeModal = closeModal;

function setupModalEvents() {
    // Gắn sự kiện siêu nhạy cho nút .modal-close nút X đóng popup
    document.querySelectorAll('.modal-close').forEach(btn => {
        const handleClose = (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            lastCloseTime = Date.now();
            const modal = btn.closest('.modal-overlay');
            if (modal) {
                modal.classList.remove('active');
            }
            return false;
        };

        btn.onclick = handleClose;
        btn.ontouchstart = handleClose;
    });

    // Chạm vùng tối ngoài popup để tắt
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                lastCloseTime = Date.now();
                modal.classList.remove('active');
            }
        });
    });

    // Phím Escape để tắt
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            lastCloseTime = Date.now();
            document.querySelectorAll('.modal-overlay.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });
}
