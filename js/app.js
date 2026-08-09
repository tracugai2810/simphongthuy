/* ==========================================================================
   MAIN UI CONTROLLER - Website Sim Phong Thủy Lục Hào Pro
   - Tự động nhảy focus 10 ô vuông điền SĐT (Chuẩn 10 chữ số VN)
   - Tích hợp Thương Mại Hóa: Phân quyền Auth, Quản Lý Xu, Trừ Xu Tra Cứu
   - Modal Xác Nhận Trừ Xu, Modal Donate QR Code, Modal Mã Giới Thiệu
   - Nút "Xem Chi Tiết":
     + Máy Tính: Mở Modal hiển thị ảnh lá quẻ, hỗ trợ chuột phải Sao chép / Lưu ảnh
     + Điện Thoại: Mở Modal hiển thị lá quẻ + Nút "📤 Chia Sẻ / Lưu Ảnh Về iPhone"
       kích hoạt chuẩn 100% iOS Native Share Sheet trên Safari/Chrome iPhone!
   ========================================================================== */

let currentResults = [];
let currentSimEvalItem = null;
let pendingAction = null; // Thao tác chờ trừ Xu (evalCurrent hoặc searchSims)
let selectedDonateTierKey = '50k';

document.addEventListener('DOMContentLoaded', () => {
    initFormDefaults();
    setupDigitBoxes();
    setupFormEvents();
    setupModalEvents();
    setupCurrentSimEval();
    setupAuthAndCommerce();
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

    // Lắng nghe sự kiện thay đổi số lượng SIM để tự động cập nhật số Xu trên nút bấm
    const limitSelect = document.getElementById('limitSelect');
    const btnSubmitSearch = document.getElementById('btnSubmitSearch');

    if (limitSelect && btnSubmitSearch) {
        limitSelect.addEventListener('change', (e) => {
            const val = parseInt(e.target.value) || 5;
            let cost = 2;
            if (val === 5) cost = 2;
            if (val === 15) cost = 6;
            if (val === 30) cost = 12;
            if (val === 50) cost = 20;

            btnSubmitSearch.innerHTML = `🔮 GỢI Ý LIST SIM CÁT TƯỜNG DỊCH HỌC (${cost} Xu)`;
        });
    }
}

// THƯƠNG MẠI HÓA & AUTH STORE UI SYNC
function setupAuthAndCommerce() {
    updateUserNavUI();

    // Nút mở Auth
    const btnOpenAuth = document.getElementById('btnOpenAuth');
    if (btnOpenAuth) btnOpenAuth.addEventListener('click', () => openModal('authModal'));

    // Nút mở Donate
    const btnShowDonate = document.getElementById('btnShowDonate');
    const btnEarnCoins = document.getElementById('btnEarnCoins');
    if (btnShowDonate) btnShowDonate.addEventListener('click', () => openDonateModal());
    if (btnEarnCoins) btnEarnCoins.addEventListener('click', () => openDonateModal());

    // Nút mở Referral Modal
    const btnShowRefModal = document.getElementById('btnShowRefModal');
    if (btnShowRefModal) btnShowRefModal.addEventListener('click', () => openRefModal());

    // Nút Đăng xuất
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) btnLogout.addEventListener('click', () => {
        AuthStore.logout();
        updateUserNavUI();
        showToast("Đã đăng xuất tài khoản!");
    });

    // Submit Form Login
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
                alert(res.message);
            }
        });
    }

    // Submit Form Register
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const u = document.getElementById('regUsername').value;
            const em = document.getElementById('regEmail').value || `${u}@simpt.local`;
            const p = document.getElementById('regPassword').value;
            const ref = document.getElementById('regRefCode').value;

            const res = AuthStore.register(u, em, p, ref);
            if (res.success) {
                closeModal('authModal');
                updateUserNavUI();
                showToast(res.message);
                if (pendingAction) {
                    executePendingActionWithConfirm();
                }
            } else {
                alert(res.message);
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
            if (res.success) {
                closeModal('donateModal');
                showToast(res.message);
            } else {
                alert(res.message);
            }
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
                alert(res.message);
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
            const url = `${window.location.origin}${window.location.pathname}?ref=${user.refCode}`;
            copySimNumberOnly(url);
        });
    }
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

        if (coinSpan) coinSpan.textContent = user.coins;
        if (refCodeSpan) refCodeSpan.textContent = user.refCode || '---';

        if (adminLinkBtn) {
            adminLinkBtn.style.display = (user.username === 'dambuicong' || user.isAdmin) ? 'inline-block' : 'none';
        }
    }
}

// BẮT MÃ GIỚI THIỆU TỪ URL (?ref=CODE)
function detectRefQuery() {
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get('ref');
    if (refParam) {
        const regRefInput = document.getElementById('regRefCode');
        if (regRefInput) regRefInput.value = refParam.toUpperCase();
    }
}

function openDonateModal() {
    const user = AuthStore.getCurrentUser();
    if (!user) {
        showToast("Vui lòng đăng nhập trước khi nạp Xu!");
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
        memoText.textContent = `DONATE ${username.toUpperCase()} ${tierKey.toUpperCase()}`;
    }
}

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

function setupFormEvents() {
    const form = document.getElementById('simForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const user = AuthStore.getCurrentUser();
        if (!user) {
            showToast("Vui lòng đăng nhập để gợi ý SIM!");
            openModal('authModal');
            return;
        }

        const limitVal = parseInt(document.getElementById('limitSelect').value) || 5;
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
    });
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

        const inputSim = document.getElementById('evalCurrentSim').value.trim();
        const rawSim = inputSim.replace(/[^0-9]/g, '');

        if (!rawSim || rawSim.length !== 10) {
            alert("Vui lòng nhập số điện thoại hợp lệ (chuẩn 10 chữ số Việt Nam)!");
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

    const confirmText = document.getElementById('confirmDeductText');
    if (confirmText) {
        confirmText.innerHTML = `
            Thao tác <strong>${pendingAction.actionName}</strong> sẽ tiêu tốn <strong style="color:#ffd700;">${pendingAction.cost} Xu</strong>.<br/>
            Số dư hiện tại của bạn: <strong>${user.coins} Xu</strong> (Sau khi trừ còn: <strong>${user.coins - pendingAction.cost} Xu</strong>).
        `;
    }

    openModal('confirmDeductModal');
}

function executeEvalCurrentSim() {
    const inputSim = document.getElementById('evalCurrentSim').value.trim();
    const rawSim = inputSim.replace(/[^0-9]/g, '');
    const birthDateVal = document.getElementById('birthDate').value;
    const gender = document.querySelector('input[name="gender"]:checked').value;
    const purpose = document.getElementById('purposeSelect').value;

    const cal = calculateCanChi(birthDateVal);
    const hexData = calculateSimHexagram(rawSim, cal);

    if (!hexData) {
        alert("Không thể lập quẻ từ dãy số này. Vui lòng kiểm tra lại SĐT!");
        return;
    }

    const evaluation = evaluateSimFengShui(rawSim, hexData, cal, purpose, gender);

    const currentSimBox = document.getElementById('currentSimResultBox');
    const formattedSim = formatSimNumber(rawSim);
    currentSimEvalItem = { sim: rawSim, hexData, evaluation };

    currentSimBox.style.display = 'block';
    currentSimBox.innerHTML = `
        <div class="sim-card" style="border: 2px solid var(--gold-dark); background: #1a2438;">
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

    currentSimBox.scrollIntoView({ behavior: 'smooth' });
}

function executeSearchSims() {
    const birthDateVal = document.getElementById('birthDate').value;
    const gender = document.querySelector('input[name="gender"]:checked').value;
    const purpose = document.getElementById('purposeSelect').value;
    const limitVal = parseInt(document.getElementById('limitSelect').value) || 5;

    let pattern = '0';
    for (let i = 2; i <= 10; i++) {
        const el = document.getElementById(`digit-${i}`);
        const val = el ? el.value.trim() : '';
        pattern += val ? val : '*';
    }

    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--gold-primary);">
            <div class="spinner" style="font-size: 2rem; margin-bottom: 10px;">🔮</div>
            <p style="font-size: 1.1rem; font-weight: 600;">Đang lập quẻ Lục Hào & Tính toán Top ${limitVal} SIM Cát Tường...</p>
        </div>
    `;

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
    }, 3000);
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
                        📤 Chia Sẻ / Lưu Ảnh Về iPhone / Điện Thoại
                    </button>
                `;
            } else {
                bottomHtml = `
                    <div class="desktop-img-hint">
                        💡 <strong>Mẹo:</strong> Bạn có thể <strong>Nhấp chuột phải vào ảnh trên</strong> để <em>Sao chép hình ảnh</em> hoặc <em>Lưu hình ảnh thành...</em> về máy tính.
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
            alert("Không thể khởi tạo file ảnh.");
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
    showToast(`Đã tải ảnh lá quẻ về máy thành công!`);
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

function setupModalEvents() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    });
}
