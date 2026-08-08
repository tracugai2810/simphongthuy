/* ==========================================================================
   MAIN UI CONTROLLER - Website Sim Phong Thủy
   ========================================================================== */

let currentResults = [];
let activeModalHexData = null;

document.addEventListener('DOMContentLoaded', () => {
    initFormDefaults();
    setupDigitBoxes();
    setupFormEvents();
    setupModalEvents();
});

// Khoảng ngày mặc định
function initFormDefaults() {
    const now = new Date();
    // UTC offset adjustment for datetime-local picker
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now.getTime() - offset)).toISOString().slice(0, 16);

    const dateInput = document.getElementById('birthDate');
    if (dateInput) {
        dateInput.value = localISOTime;
    }
}

// Thiết lập chuyển focus tự động giữa các ô vuông điền số (Như Ảnh 1)
function setupDigitBoxes() {
    const boxes = Array.from(document.querySelectorAll('.digit-box:not(.fixed-zero)'));

    boxes.forEach((box, idx) => {
        // Gõ phím số -> Tự sang ô tiếp theo
        box.addEventListener('input', (e) => {
            const val = e.target.value;
            // Chỉ giữ lại chữ số
            e.target.value = val.replace(/[^0-9]/g, '');

            if (e.target.value.length >= 1) {
                e.target.value = e.target.value.slice(-1); // chỉ giữ 1 ký tự
                if (idx < boxes.length - 1) {
                    boxes[idx + 1].focus();
                }
            }
        });

        // Nhấn Backspace -> Tự quay về ô trước
        box.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value) {
                if (idx > 0) {
                    boxes[idx - 1].focus();
                }
            }
        });

        // Tự bôi đen khi focus
        box.addEventListener('focus', (e) => {
            e.target.select();
        });
    });

    // Sự kiện đổi đầu số nhanh
    const prefixSelect = document.getElementById('prefixSelect');
    if (prefixSelect) {
        prefixSelect.addEventListener('change', (e) => {
            const prefix = e.target.value;
            if (!prefix) return;

            // Điền chữ số từ đầu số vào các ô
            // Chữ số 1 = '0' (cố định)
            // Chữ số 2 & 3: điền theo prefix
            const digit2 = document.getElementById('digit-2');
            const digit3 = document.getElementById('digit-3');

            if (prefix.length >= 2 && digit2) digit2.value = prefix[1] || '';
            if (prefix.length >= 3 && digit3) digit3.value = prefix[2] || '';
        });
    }
}

// Xử lý nộp form sinh SIM
function setupFormEvents() {
    const form = document.getElementById('simForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        processSearch();
    });
}

function processSearch() {
    const birthDateVal = document.getElementById('birthDate').value;
    if (!birthDateVal) {
        alert("Vui lòng chọn ngày tháng năm sinh!");
        return;
    }

    const gender = document.querySelector('input[name="gender"]:checked').value;
    const purpose = document.getElementById('purposeSelect').value;

    // Gộp pattern từ các ô chữ số
    let pattern = '0';
    for (let i = 2; i <= 10; i++) {
        const el = document.getElementById(`digit-${i}`);
        const val = el ? el.value.trim() : '';
        pattern += val ? val : '*';
    }

    // Hiển thị trạng thái đang tính toán
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--gold-primary);">
            <div class="spinner" style="font-size: 2rem; margin-bottom: 10px;">🔮</div>
            <p style="font-size: 1.1rem; font-weight: 600;">Đang lập quẻ Lục Hào & Tính toán danh sách SIM Cát Tường...</p>
        </div>
    `;

    setTimeout(() => {
        currentResults = generateMatchingSims(pattern, birthDateVal, gender, purpose, 15);
        renderResults(currentResults);
    }, 150);
}

// Render kết quả danh sách SIM
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
                    <button class="btn-action btn-view-hex" onclick="openHexModal(${index})">
                        🔍 Xem Lá Quẻ
                    </button>
                    <button class="btn-action btn-copy-info" onclick="copySimAnalysis(${index})">
                        📋 Sao Chép
                    </button>
                </div>
            </div>
        `;
    });

    html += '</div>';
    resultsContainer.innerHTML = html;
}

// Định dạng số điện thoại đẹp (ví dụ: 098.765.4321)
function formatSimNumber(sim) {
    if (sim.length === 10) {
        return `${sim.slice(0, 4)}.${sim.slice(4, 7)}.${sim.slice(7)}`;
    }
    return sim;
}

// Hiển thị Modal lá quẻ Lục Hào chi tiết
function openHexModal(index) {
    const item = currentResults[index];
    if (!item) return;

    activeModalHexData = item.hexData;
    const { hexData, sim, evaluation } = item;
    const modal = document.getElementById('hexModal');
    const modalBody = document.getElementById('modalBody');

    let rowsHtml = '';
    for (let i = 5; i >= 0; i--) {
        const line = hexData.linesData[i];
        let sym = (line.val === 1) ? '—' : (line.val === 2) ? '--' : (line.val === 3) ? 'O' : 'X';
        let sy = '';
        if (line.isShi) sy = `<span class="marker-the">Thế</span>`;
        if (line.isYing) sy = `<span class="marker-ung">Ứng</span>`;

        let phucHtml = '-';
        if (line.phucThan) {
            phucHtml = `<span style="color:#ffd700;">${line.phucThan.rel} (${line.phucThan.branch})</span>`;
        }

        const isTK = line.isTK ? '<span style="color:#f87171;">Không</span>' : '-';

        rowsHtml += `
            <tr>
                <td><strong>Hào ${i + 1}</strong></td>
                <td>${sym}</td>
                <td>${sy}</td>
                <td style="color:#f3c669; font-weight:bold;">${line.relation}</td>
                <td>${line.chi} (${line.hanh})</td>
                <td>${phucHtml}</td>
                <td>${isTK}</td>
                <td style="color:#60a5fa;">${line.changed.relation}</td>
                <td>${line.changed.branch} (${line.changed.hanh})</td>
                <td>${line.lucThu}</td>
                <td>${line.tsNgay}</td>
            </tr>
        `;
    }

    modalBody.innerHTML = `
        <h2 style="color:var(--gold-primary); font-family:var(--font-title); font-size:2rem; margin-bottom:5px;">
            Lá Quẻ Lục Hào: ${formatSimNumber(sim)}
        </h2>
        <p style="color:var(--text-muted); margin-bottom:15px;">${hexData.dateInfo.fullCanChi}</p>

        <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:10px; margin-bottom:20px; border-left:4px solid var(--gold-primary);">
            <p><strong>Quẻ Chủ:</strong> ${hexData.mainName} (Họ ${hexData.palaceName})</p>
            <p><strong>Quẻ Biến:</strong> ${hexData.changedName} (Họ ${hexData.changedPalaceName})</p>
            <p><strong>Nhật Thần:</strong> ${hexData.dateInfo.nhatThan} &nbsp;|&nbsp; <strong>Nguyệt Lệnh:</strong> ${hexData.dateInfo.nguyetLenh}</p>
            <p><strong>Tuần Không:</strong> ${hexData.dateInfo.tuanKhong}</p>
        </div>

        <table class="hex-table">
            <thead>
                <tr>
                    <th>Hào</th>
                    <th>Tượng</th>
                    <th>T/Ứng</th>
                    <th>Lục Thân</th>
                    <th>Can Chi</th>
                    <th>Phục Thần</th>
                    <th>T.Không</th>
                    <th>Quẻ Biến</th>
                    <th>Biến Chi</th>
                    <th>Lục Thú</th>
                    <th>Trường Sinh</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml}
            </tbody>
        </table>

        <div style="margin-top:20px; background:rgba(46,204,113,0.1); padding:15px; border-radius:10px; border:1px solid #2ecc71;">
            <h4 style="color:#2ecc71; margin-bottom:5px;">Đánh giá Phong Thủy: ${evaluation.score}/100 - ${evaluation.grade}</h4>
            <ul style="padding-left:20px; color:#e2e8f0;">
                ${evaluation.reasons.map(r => `<li>${r}</li>`).join('')}
            </ul>
        </div>
    `;

    modal.classList.add('active');
}

function setupModalEvents() {
    const modal = document.getElementById('hexModal');
    const closeBtn = document.getElementById('modalClose');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    }
}

// Sao chép văn bản phân tích để gửi khách Zalo
function copySimAnalysis(index) {
    const item = currentResults[index];
    if (!item) return;

    const { sim, hexData, evaluation } = item;
    let text = `📱 PHÂN TÍCH SIM PHONG THỦY: ${formatSimNumber(sim)}\n`;
    text += `🎯 Điểm Cát Tường: ${evaluation.score}/100 - ${evaluation.grade}\n`;
    text += `☯️ Quẻ Lục Hào: ${hexData.mainName} ➔ ${hexData.changedName}\n`;
    text += `📅 Ngày giờ lập quẻ: ${hexData.dateInfo.fullCanChi}\n`;
    text += `✨ Đánh giá Cát Tường:\n`;
    evaluation.reasons.forEach(r => {
        text += `- ${r}\n`;
    });

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            alert(`Đã sao chép phân tích SIM ${formatSimNumber(sim)}! Bạn có thể dán (Paste) vào Zalo tư vấn cho khách.`);
        }).catch(() => fallbackCopy(text));
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    alert("Đã sao chép nội dung phân tích thành công!");
}
