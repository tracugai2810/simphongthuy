/* ==========================================================================
   SIM PHONG THỦY ENGINE & EVALUATOR - CHUẨN ĐÃI LỌC DỊCH HỌC LỤC HÀO
   Đánh giá theo đúng thứ tự ưu tiên:
   1. Hào Thế (Hưng / Vượng, không bị Nhật/Nguyệt khắc, không bị suy bại: hóa khắc, hóa thoái, hóa tuyệt)
   2. Dụng Thần (Vượng tại Nhật/Nguyệt, Hóa tiến thần, Hóa hồi đầu sinh)
   3. Tương tác Dụng Thần & Hào Thế (Dụng thần động sinh Thế = Tốt nhất; Tài lai khắc Thế = Bắt buộc Thế vượng cả Nhật lẫn Nguyệt)
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

// Kiểm tra 6 cặp Lục Hợp Địa Chi
function isBranchHarmonious(b1, b2) {
    const pairs = [
        ['Tý', 'Sửu'], ['Dần', 'Hợi'], ['Mão', 'Tuất'],
        ['Thìn', 'Dậu'], ['Tỵ', 'Thân'], ['Ngọ', 'Mùi']
    ];
    return pairs.some(([a, b]) => (a === b1 && b === b2) || (a === b2 && b === b1));
}

// Hóa Tiến Thần (Tiến lên cùng ngũ hành)
function isProgressingBranch(bMain, bChanged) {
    const prog = {
        'Dần': 'Mão', 'Tỵ': 'Ngọ', 'Thân': 'Dậu', 'Hợi': 'Tý',
        'Sửu': 'Thìn', 'Thìn': 'Mùi', 'Mùi': 'Tuất', 'Tuất': 'Sửu'
    };
    return prog[bMain] === bChanged;
}

// Hóa Thoái Thần (Lùi xuống cùng ngũ hành)
function isRegressingBranch(bMain, bChanged) {
    const reg = {
        'Mão': 'Dần', 'Ngọ': 'Tỵ', 'Dậu': 'Thân', 'Tý': 'Hợi',
        'Thìn': 'Sửu', 'Mùi': 'Thìn', 'Tuất': 'Mùi', 'Sửu': 'Tuất'
    };
    return reg[bMain] === bChanged;
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
            return 'Thế';
        case 'concai':
            return 'Tử Tôn';
        case 'honnhan':
            return (gender === 'male') ? 'Thê Tài' : 'Quan Quỷ';
        default:
            return 'Thê Tài';
    }
}

// Đánh giá quẻ SIM nghiêm ngặt theo đúng thuật toán Lục Hào
function evaluateSimFengShui(simStr, hexData, cal, purpose, gender) {
    if (!hexData) return { isQualified: false, score: 0, grade: 'Không hợp lệ', reasons: ['Không thể lập quẻ.'] };

    const reasons = [];
    let score = 40; // Điểm cơ sở

    const nhatChi = cal.ngay.chi;
    const nhatHanh = cal.ngay.hanh;
    const nguyetChi = cal.thang.chi;
    const nguyetHanh = cal.thang.hanh;

    // --- 1. ĐÁNH GIÁ HÀO THẾ (Yếu tố cốt lõi số 1) ---
    const haoThe = hexData.linesData.find(l => l.isShi);
    if (!haoThe) {
        return { isQualified: false, score: 0, grade: 'Khắc', reasons: ['Không tìm thấy Hào Thế.'] };
    }

    const theHanh = haoThe.hanh;
    const theChi = haoThe.chi;

    // A. Kiểm tra SUY BẠI của Hào Thế -> BẮT BUỘC LOẠI BỎ NẾU XẤU
    const bịNhậtKhắc = isOvercoming(nhatHanh, theHanh);
    const bịNguyệtKhắc = isOvercoming(nguyetHanh, theHanh);

    if (bịNhậtKhắc || bịNguyệtKhắc) {
        return {
            isQualified: false,
            score: 10,
            grade: 'Hung',
            reasons: ['Hào Thế bị Nhật Thần hoặc Nguyệt Lệnh tương khắc (Suy vi, bỏ).']
        };
    }

    // Nếu Hào Thế ĐỘNG: Kiểm tra Hóa Khắc, Hóa Thoái, Hóa Tuyệt
    if (haoThe.isMoving) {
        const hoiDauKhac = isOvercoming(haoThe.changed.hanh, theHanh);
        const hoaThoai = isRegressingBranch(theChi, haoThe.changed.branch);
        const hoaTuyet = (getLifeStage(theHanh, haoThe.changed.branch) === 'Tuyệt');

        if (hoiDauKhac || hoaThoai || hoaTuyet) {
            let reasonText = "Hào Thế động ";
            if (hoiDauKhac) reasonText += "hóa Hồi Đầu Khắc.";
            else if (hoaThoai) reasonText += "hóa Thoái Thần.";
            else reasonText += "hóa Tuyệt.";
            return {
                isQualified: false,
                score: 15,
                grade: 'Suy Bại',
                reasons: [reasonText + " (Thuộc thế suy bại, bắt buộc loại bỏ)."]
            };
        }
    }

    // B. Kiểm tra "THẾ HƯNG" (Hào Thế Vượng / Hưng)
    const isLamNhatNguyet = (theChi === nhatChi || theChi === nguyetChi);
    const isNguyetHop = isBranchHarmonious(theChi, nguyetChi);
    const isNhatHop = !haoThe.isMoving && isBranchHarmonious(theChi, nhatChi); // Nhật hợp chỉ tính khi Thế tĩnh
    const isNguyetSinhPho = (theHanh === nguyetHanh || isGenerating(nguyetHanh, theHanh));
    const isNhatSinhPho = (theHanh === nhatHanh || isGenerating(nhatHanh, theHanh));

    let theScore = 0;

    if (haoThe.isMoving) {
        // Hào Thế ĐỘNG: Hóa Hồi Đầu Sinh hoặc Hóa Tiến Thần -> TỐT NHẤT
        const hoiDauSinh = isGenerating(haoThe.changed.hanh, theHanh);
        const hoaTien = isProgressingBranch(theChi, haoThe.changed.branch);

        if (hoiDauSinh || hoaTien) {
            if (isLamNhatNguyet || isNguyetHop) {
                theScore = 40;
                reasons.push(`Hào Thế (${theChi}) Lâm/Hợp Nhật Nguyệt lại Động hóa ${hoaTien ? 'Tiến Thần' : 'Hồi Đầu Sinh'} (Tối Đại Cát).`);
            } else if (isNguyetSinhPho) {
                theScore = 35;
                reasons.push(`Hào Thế (${theChi}) được Nguyệt Lệnh sinh phò, Động hóa ${hoaTien ? 'Tiến Thần' : 'Hồi Đầu Sinh'}.`);
            } else if (isNhatSinhPho) {
                theScore = 30;
                reasons.push(`Hào Thế (${theChi}) được Nhật Thần sinh phò, Động hóa ${hoaTien ? 'Tiến Thần' : 'Hồi Đầu Sinh'}.`);
            } else {
                theScore = 25;
                reasons.push(`Hào Thế (${theChi}) Động hóa ${hoaTien ? 'Tiến Thần' : 'Hồi Đầu Sinh'} (Thế Hưng).`);
            }
        } else {
            // Động nhưng không hóa sinh/tiến -> Xét theo Nhật Nguyệt
            if (isLamNhatNguyet || isNguyetHop) {
                theScore = 30;
                reasons.push(`Hào Thế (${theChi}) Lâm/Hợp Nhật Nguyệt vượng thế.`);
            } else if (isNguyetSinhPho) {
                theScore = 25;
                reasons.push(`Hào Thế (${theChi}) được Nguyệt Lệnh (${nguyetChi}) vượng sinh/phò.`);
            } else if (isNhatSinhPho) {
                theScore = 20;
                reasons.push(`Hào Thế (${theChi}) được Nhật Thần (${nhatChi}) vượng sinh/phò.`);
            }
        }
    } else {
        // Hào Thế TĨNH
        if (isLamNhatNguyet || isNguyetHop || isNhatHop) {
            theScore = 35;
            let note = isLamNhatNguyet ? 'Lâm Nhật/Nguyệt' : isNguyetHop ? 'Nguyệt Hợp' : 'Nhật Hợp';
            reasons.push(`Hào Thế Tĩnh (${theChi}) được ${note} (Thế Vượng Hưng).`);
        } else if (isNguyetSinhPho) {
            theScore = 25;
            reasons.push(`Hào Thế Tĩnh (${theChi}) được Nguyệt Lệnh (${nguyetChi}) sinh phò.`);
        } else if (isNhatSinhPho) {
            theScore = 20;
            reasons.push(`Hào Thế Tĩnh (${theChi}) được Nhật Thần (${nhatChi}) sinh phò.`);
        } else {
            // Hào Thế tĩnh không vượng không sinh -> Bỏ
            return {
                isQualified: false,
                score: 30,
                grade: 'Thế Suy',
                reasons: ['Hào Thế tĩnh không đạt thế Hưng tại Nhật Nguyệt (Bỏ).']
            };
        }
    }

    score += theScore;

    // --- 2. ĐÁNH GIÁ DỤNG THẦN (Yếu tố quan trọng số 2) ---
    const targetRel = getTargetRelation(purpose, gender);
    let dungThanLines = [];

    if (targetRel === 'Thế') {
        dungThanLines = [haoThe];
    } else {
        dungThanLines = hexData.linesData.filter(l => l.relation.startsWith(targetRel));
    }

    if (dungThanLines.length === 0 && targetRel !== 'Thế') {
        return {
            isQualified: false,
            score: 20,
            grade: 'Khuyết Dụng Thần',
            reasons: [`Dụng Thần ${targetRel} không xuất hiện trong quẻ (Loại bỏ).`]
        };
    }

    let dungScore = 0;
    let dungThanDongSinhThe = false;
    let dungThanKhacTheHopLe = false;

    dungThanLines.forEach(dt => {
        const dtHanh = dt.hanh;
        const dtChi = dt.chi;

        // A. Tương tác Dụng Thần -> Hào Thế
        if (dt.isMoving) {
            if (isGenerating(dtHanh, theHanh)) {
                dungThanDongSinhThe = true;
                reasons.push(`🔥 Dụng Thần ${targetRel} (${dtChi}) ĐỘNG SINH HÀO THẾ (${theChi}) - Thượng Cát Tường!`);
            }

            // Trường hợp CẦU TÀI: Dụng thần Thê Tài ĐỘNG KHẮC Hào Thế ("Tài Lai Khắc Thế")
            if (purpose === 'cautai' && isOvercoming(dtHanh, theHanh)) {
                // BẮT BUỘC Hào Thế phải VƯỢNG Ở CẢ NHẬT LẪN NGUYỆT
                if (isNhatSinhPho && isNguyetSinhPho) {
                    dungThanKhacTheHopLe = true;
                    reasons.push(`Dụng Thần Thê Tài Động Khắc Hào Thế (Tài Lai Khắc Thế), Hào Thế vượng cả Nhật lẫn Nguyệt nên Nhận Được Tài.`);
                } else {
                    // Nếu Thế không vượng cả 2 -> Loại bỏ lập tức
                    return;
                }
            }
        }

        // B. Thứ tự Vượng của Dụng Thần
        const dtLamNhatNguyet = (dtChi === nhatChi || dtChi === nguyetChi);
        const dtNguyetHop = isBranchHarmonious(dtChi, nguyetChi);
        const dtNhatHop = !dt.isMoving && isBranchHarmonious(dtChi, nhatChi);
        const dtNguyetSinh = (dtHanh === nguyetHanh || isGenerating(nguyetHanh, dtHanh));
        const dtNhatSinh = (dtHanh === nhatHanh || isGenerating(nhatHanh, dtHanh));

        if (dt.isMoving) {
            const dtHoiDauSinh = isGenerating(dt.changed.hanh, dtHanh);
            const dtHoaTien = isProgressingBranch(dtChi, dt.changed.branch);

            if (dtHoiDauSinh || dtHoaTien) {
                if (dtLamNhatNguyet || dtNguyetHop) dungScore += 35;
                else if (dtNguyetSinh) dungScore += 30;
                else dungScore += 25;
                reasons.push(`Dụng Thần ${targetRel} (${dtChi}) vượng tại Nhật/Nguyệt lại Động hóa ${dtHoaTien ? 'Tiến Thần' : 'Hồi Đầu Sinh'}.`);
            } else {
                if (dtLamNhatNguyet || dtNguyetHop) dungScore += 25;
                else if (dtNguyetSinh) dungScore += 20;
            }
        } else {
            // Tĩnh
            if (dtLamNhatNguyet || dtNguyetHop || dtNhatHop) dungScore += 30;
            else if (dtNguyetSinh) dungScore += 20;
            else if (dtNhatSinh) dungScore += 15;
        }
    });

    // Nếu Cầu Tài rơi vào trường hợp Dụng Thần Khắc Thế nhưng Thế KHÔNG vượng cả Nhật Nguyệt -> Không hợp lệ
    if (purpose === 'cautai') {
        const hasDtKhac = dungThanLines.some(dt => dt.isMoving && isOvercoming(dt.hanh, theHanh));
        if (hasDtKhac && !dungThanKhacTheHopLe) {
            return {
                isQualified: false,
                score: 25,
                grade: 'Tài Khắc Thế Suy',
                reasons: ['Tài lai khắc Thế nhưng Hào Thế không vượng ở cả Nhật lẫn Nguyệt (Bỏ).']
            };
        }
    }

    score += dungScore;
    if (dungThanDongSinhThe) score += 20;

    // --- 3. ĐẶC TÍNH QUẺ CÁT ---
    const mainName = hexData.mainName;
    if (mainName.includes('Thái') || mainName.includes('Trung Phu') || mainName.includes('Đại Hữu') || mainName.includes('Gia Nhân') || mainName.includes('Ích') || mainName.includes('Tụy')) {
        score += 10;
        reasons.push(`Quẻ Chủ ${mainName} thuộc Đại Cát Quẻ.`);
    }

    score = Math.min(100, Math.max(0, score));

    let grade = 'Đại Cát';
    if (score >= 90) grade = 'Đại Cát (Top 1)';
    else if (score >= 85) grade = 'Thượng Cát';
    else if (score >= 75) grade = 'Trung Cát';
    else grade = 'Cát Tường';

    return {
        isQualified: score >= 70,
        score,
        grade,
        reasons
    };
}

// Thuật toán Sinh & Xếp Hạng SIM từ Mẫu số nhập vào
function generateMatchingSims(pattern, dateInput, gender, purpose, maxCount = 15) {
    const cal = calculateCanChi(dateInput);
    if (!cal) return [];

    const fixedPattern = pattern.replace(/[^0-9*]/g, '');
    const isWildcard = (char) => !char || char === '*';

    const candidates = [];
    const maxIterations = 3500;
    let count = 0;

    function generateRecursive(currentStr, index) {
        if (candidates.length >= maxCount * 6 || count >= maxIterations) return;
        count++;

        if (index >= fixedPattern.length) {
            if (currentStr.length >= 9) candidates.push(currentStr);
            return;
        }

        const char = fixedPattern[index];
        if (!isWildcard(char)) {
            generateRecursive(currentStr + char, index + 1);
        } else {
            const digits = ['8', '6', '9', '3', '5', '2', '7', '1', '0', '4'];
            const shuffled = [...digits].sort(() => Math.random() - 0.5);

            for (let d of shuffled) {
                generateRecursive(currentStr + d, index + 1);
                if (candidates.length >= maxCount * 6 || count >= maxIterations) break;
            }
        }
    }

    generateRecursive('', 0);

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

    results.sort((a, b) => b.evaluation.score - a.evaluation.score);

    return results.slice(0, maxCount);
}
