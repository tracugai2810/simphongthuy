/* ==========================================================================
   MAIN UI CONTROLLER - Website Sim Phong Thủy
   - Tự động nhảy focus 10 ô vuông điền SĐT
   - Nút Sao chép SĐT kèm thông báo Toast
   - Khung Lá Quẻ render y hệt Web cũ + Xuất/Tải Ảnh Quẻ (html2canvas không mất góc)
   ========================================================================== */

let currentResults = [];

document.addEventListener('DOMContentLoaded', () => {
    initFormDefaults();
    setupDigitBoxes();
    setupFormEvents();
    setupModalEvents();
});

function initFormDefaults() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now.getTime() - offset)).toISOString().slice(0, 16);

    const dateInput = document.getElementById('birthDate');
    if (dateInput) {
        dateInput.value = localISOTime;
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
            <p style="font-size: 1.1rem; font-weight: 600;">Đang lập quẻ Lục Hào & Tính toán danh sách SIM Cát Tường...</p>
        </div>
    `;

    setTimeout(() => {
        currentResults = generateMatchingSims(pattern, birthDateVal, gender, purpose, 15);
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
                    <button class="btn-action btn-view-hex" onclick="openHexModal(${index})">
                        🔍 Xem Lá Quẻ
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

// CHỈ SAO CHÉP SĐT + HIỂN THỊ TOAST THÔNG BÁO (Theo Yêu cầu Ảnh 3)
function copySimNumberOnly(simStr) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(simStr).then(() => {
            showToast(`Đã sao chép SĐT: ${simStr}`);
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
    showToast(`Đã sao chép SĐT: ${text}`);
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
    }, 2500);
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

// Hiển thị Modal lá quẻ Lục Hào CHUẨN Y HỆT WEB CŨ
function openHexModal(index) {
    const item = currentResults[index];
    if (!item) return;

    const { hexData, sim, evaluation } = item;
    const modal = document.getElementById('hexModal');
    const modalBody = document.getElementById('modalBody');

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

    modalBody.innerHTML = `
        <div class="hex-card-scroll-wrapper">
            <div id="hexCardCapture" class="hex-card-view">
                <!-- Header Thông Tin (Định dạng Nhật Thần: Dần - Mộc theo Ảnh 1) -->
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

    const downloadImgBtn = document.getElementById('downloadImgBtn');
    if (downloadImgBtn) {
        downloadImgBtn.addEventListener('click', () => downloadHexImage());
    }

    const copyImgBtn = document.getElementById('copyImgBtn');
    if (copyImgBtn) {
        copyImgBtn.addEventListener('click', () => copyHexImage());
    }
}

// Tải Ảnh Quẻ PNG (Không bị mất góc bên trái)
function downloadHexImage() {
    const target = document.getElementById('hexCardCapture');
    if (!target || typeof html2canvas === 'undefined') {
        alert("Đang tải thư viện tạo ảnh, vui lòng thử lại!");
        return;
    }

    html2canvas(target, {
        scale: 2,
        useCORS: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 900
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `la-que-sim-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast("Đã tải ảnh lá quẻ về máy thành công!");
    }).catch(err => {
        console.error('html2canvas error:', err);
        alert("Có lỗi khi tạo ảnh lá quẻ.");
    });
}

// Sao chép Ảnh Quẻ vào Clipboard
function copyHexImage() {
    const target = document.getElementById('hexCardCapture');
    if (!target || typeof html2canvas === 'undefined') {
        alert("Đang tải thư viện tạo ảnh, vui lòng thử lại!");
        return;
    }

    html2canvas(target, {
        scale: 2,
        useCORS: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 900
    }).then(canvas => {
        canvas.toBlob(blob => {
            if (navigator.clipboard && navigator.clipboard.write) {
                const item = new ClipboardItem({ 'image/png': blob });
                navigator.clipboard.write([item]).then(() => {
                    showToast("Đã sao chép ảnh lá quẻ thành công!");
                }).catch(() => {
                    alert("Trình duyệt không hỗ trợ copy ảnh trực tiếp.");
                });
            } else {
                alert("Trình duyệt không hỗ trợ copy ảnh trực tiếp.");
            }
        });
    }).catch(err => {
        console.error('html2canvas error:', err);
    });
}
