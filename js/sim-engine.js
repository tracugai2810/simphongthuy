/* ==========================================================================
   SIM PHONG THỦY ENGINE & EVALUATOR
   Bao gồm:
   - Ngũ hành Tương Sinh / Tương Khắc
   - Đánh giá Hào Thế (không bị Nhật/Nguyệt khắc)
   - Đánh giá Dụng Thần vượng/sinh theo 5 nhu cầu (Cầu tài, Cầu quan, Sức khỏe, Con cái, Hôn nhân)
   - Thuật toán sinh & lọc danh sách SIM Cát Tường
   ========================================================================== */

const ELEMENTS = ['Kim', 'Thủy', 'Mộc', 'Hỏa', 'Thổ'];

// Element A generates Element B?
function isGenerating(elA, elB) {
    const idxA = ELEMENTS.indexOf(elA);
    const idxB = ELEMENTS.indexOf(elB);
    return (idxA + 1) % 5 === idxB;
}

// Element A overcomes / counters Element B?
function isOvercoming(elA, elB) {
    const idxA = ELEMENTS.indexOf(elA);
    const idxB = ELEMENTS.indexOf(elB);
    return (idxA + 2) % 5 === idxB;
}

// Tên 5 nhu cầu
const PURPOSE_NAMES = {
    'cautai': 'Cầu Tài Lộc',
    'cauquan': 'Cầu Công Danh / Sự Nghiệp',
    'suckhoe': 'Cầu Sức Khỏe & Bình An',
    'concai': 'Cầu Con Cái & Gia Đạo',
    'honnhan': 'Cầu Hôn Nhân & Tình Duyên'
};

// Xác định Dụng Thần theo Nhu cầu & Giới tính
function getTargetRelation(purpose, gender) {
    switch (purpose) {
        case 'cautai':
            return 'Thê Tài';
        case 'cauquan':
            return 'Quan Quỷ';
        case 'suckhoe':
            return 'Thế'; // Hào Thế
        case 'concai':
            return 'Tử Tôn';
        case 'honnhan':
            return (gender === 'male') ? 'Thê Tài' : 'Quan Quỷ';
        default:
            return 'Thê Tài';
    }
}

// Đánh giá quẻ SIM với Ngày sinh & Nhu cầu
function evaluateSimFengShui(simStr, hexData, cal, purpose, gender) {
    if (!hexData) return { isQualified: false, score: 0, grade: 'Không hợp lệ', reasons: ['Không thể lập quẻ.'] };

    const reasons = [];
    let score = 50; // Điểm cơ sở

    const nhatHanh = cal.ngay.hanh;
    const nguyetHanh = cal.thang.hanh;

    // 1. Tìm Hào Thế
    const haoThe = hexData.linesData.find(l => l.isShi);
    const theHanh = haoThe ? haoThe.hanh : null;

    // --- KIỂM TRA ĐIỀU KIỆN AN TOÀN BẮT BUỘC: Hào Thế không bị Nhật/Nguyệt khắc ---
    if (theHanh) {
        const bịNhậtKhắc = isOvercoming(nhatHanh, theHanh);
        const bịNguyệtKhắc = isOvercoming(nguyetHanh, theHanh);

        if (bịNhậtKhắc || bịNguyệtKhắc) {
            let reasonStr = "Hào Thế (chủ gia) bị ";
            if (bịNhậtKhắc && bịNguyệtKhắc) reasonStr += "cả Nhật Thần & Nguyệt Lệnh khắc (Suy vi cực điểm).";
            else if (bịNhậtKhắc) reasonStr += `Nhật Thần ${cal.ngay.chi} (${nhatHanh}) khắc.`;
            else reasonStr += `Nguyệt Lệnh ${cal.thang.chi} (${nguyetHanh}) khắc.`;

            return {
                isQualified: false,
                score: 25,
                grade: 'Hung',
                reasons: [reasonStr, "Hào Thế bị tổn thương, số này không dùng cho khách hàng được."]
            };
        } else {
            reasons.push(`Hào Thế (${haoThe.chi} - ${theHanh}) an toàn, không bị Nhật/Nguyệt khắc.`);
            score += 15;
        }

        // Hào Thế được Nhật hoặc Nguyệt sinh/hòa
        if (nhatHanh === theHanh || isGenerating(nhatHanh, theHanh)) {
            score += 10;
            reasons.push(`Hào Thế được Nhật Thần (${cal.ngay.chi} ${nhatHanh}) vượng sinh.`);
        }
        if (nguyetHanh === theHanh || isGenerating(nguyetHanh, theHanh)) {
            score += 10;
            reasons.push(`Hào Thế được Nguyệt Lệnh (${cal.thang.chi} ${nguyetHanh}) vượng trợ.`);
        }
    }

    // --- 2. KIỂM TRA DỤNG THẦN THEO NHU CẦU ---
    const targetRel = getTargetRelation(purpose, gender);
    let targetLines = [];

    if (targetRel === 'Thế') {
        targetLines = [haoThe];
    } else {
        targetLines = hexData.linesData.filter(l => l.relation.startsWith(targetRel));
    }

    // Nếu quẻ không có Dụng thần trực tiếp, tìm Phục Thần
    let isPhucThan = false;
    if (targetLines.length === 0 && targetRel !== 'Thế') {
        const phucLine = hexData.linesData.find(l => l.phucThan && l.phucThan.rel.startsWith(targetRel.split(' ')[0]));
        if (phucLine) {
            isPhucThan = true;
            reasons.push(`Dụng Thần (${targetRel}) ẩn dưới Phục Thần (${phucLine.phucThan.branch}).`);
        } else {
            reasons.push(`Dụng Thần (${targetRel}) không xuất hiện trong quẻ.`);
            score -= 15;
        }
    }

    let dungThanVung = false;
    let duocDongSinh = false;

    // Kiểm tra từng Hào Dụng Thần
    targetLines.forEach(line => {
        const dungHanh = line.hanh;

        // Vượng tại Nhật/Nguyệt?
        if (dungHanh === nhatHanh || isGenerating(nhatHanh, dungHanh) ||
            dungHanh === nguyetHanh || isGenerating(nguyetHanh, dungHanh)) {
            dungThanVung = true;
        }

        // Có Hào Động sinh cho Dụng Thần không?
        hexData.linesData.forEach(dLine => {
            if (dLine.isMoving && isGenerating(dLine.hanh, dungHanh)) {
                duocDongSinh = true;
                reasons.push(`Dụng Thần ${targetRel} (${line.chi}) được Hào Động (${dLine.chi} ${dLine.hanh}) tương sinh.`);
            }
        });
    });

    if (dungThanVung) {
        score += 15;
        reasons.push(`Dụng Thần ${targetRel} đạt thế Vượng Tướng tại Nhật/Nguyệt.`);
    }

    if (duocDongSinh) {
        score += 15;
    }

    // --- 3. KIỂM TRA ĐẶC TÍNH QUẺ CÁT ---
    const mainName = hexData.mainName;
    if (mainName.includes('Thái') || mainName.includes('Trung Phu') || mainName.includes('Đại Hữu') || mainName.includes('Gia Nhân') || mainName.includes('Ích') || mainName.includes('Tụy')) {
        score += 10;
        reasons.push(`Quẻ Chủ là ${mainName} - Thuộc Đại Cát Quẻ.`);
    }

    // Khống chế điểm từ 0 -> 100
    score = Math.min(100, Math.max(0, score));

    let grade = 'Đại Cát';
    if (score >= 90) grade = 'Đại Cát (Top 1)';
    else if (score >= 80) grade = 'Thượng Cát';
    else if (score >= 70) grade = 'Trung Cát';
    else grade = 'Bình Thường';

    return {
        isQualified: score >= 65,
        score,
        grade,
        reasons
    };
}

// Thuật toán Sinh & Xếp Hạng SIM từ Mẫu số nhập vào
function generateMatchingSims(pattern, dateInput, gender, purpose, maxCount = 20) {
    const cal = calculateCanChi(dateInput);
    if (!cal) return [];

    // Tách pattern: pattern dạng chuỗi 10 ký tự, ví dụ "098***6868"
    // Các vị trí '*' hoặc ' ' là wildcard
    const fixedPattern = pattern.replace(/[^0-9*]/g, '');
    const isWildcard = (char) => !char || char === '*';

    // Tạo danh sách các ứng viên SIM
    const candidates = [];
    const maxIterations = 3000; // Số lượt chạy thử nghiệm an toàn để không lag browser
    let count = 0;

    // Sinh số biến đổi cho các ô trống
    function generateRecursive(currentStr, index) {
        if (candidates.length >= maxCount * 5 || count >= maxIterations) return;
        count++;

        if (index >= fixedPattern.length) {
            if (currentStr.length >= 9) {
                candidates.push(currentStr);
            }
            return;
        }

        const char = fixedPattern[index];
        if (!isWildcard(char)) {
            generateRecursive(currentStr + char, index + 1);
        } else {
            // Chọn ngẫu nhiên hoặc lặp qua các chữ số đẹp (6, 8, 9, 3, 5, 2, 7, 1, 0, 4)
            const digits = ['8', '6', '9', '3', '5', '2', '7', '1', '0', '4'];
            // Xáo trộn nhẹ để kết quả phong phú
            const shuffled = [...digits].sort(() => Math.random() - 0.5);

            for (let d of shuffled) {
                generateRecursive(currentStr + d, index + 1);
                if (candidates.length >= maxCount * 5 || count >= maxIterations) break;
            }
        }
    }

    generateRecursive('', 0);

    // Loại bỏ số trùng lặp
    const uniqueSims = Array.from(new Set(candidates));
    const results = [];

    for (let sim of uniqueSims) {
        const hexData = calculateSimHexagram(sim, cal);
        if (!hexData) continue;

        const evalResult = evaluateSimFengShui(sim, hexData, cal, purpose, gender);

        if (evalResult.isQualified) {
            results.push({
                sim,
                hexData,
                evaluation: evalResult
            });
        }
    }

    // Sắp xếp giảm dần theo điểm số Phong Thủy
    results.sort((a, b) => b.evaluation.score - a.evaluation.score);

    // Trả về Top kết quả tốt nhất
    return results.slice(0, maxCount);
}
