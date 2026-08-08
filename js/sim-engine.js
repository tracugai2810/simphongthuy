/* ==========================================================================
   SIM PHONG THỦY ENGINE & EVALUATOR - CHUẨN ĐÃI LỌC DỊCH HỌC LỤC HÀO
   Đánh giá theo đúng thứ tự ưu tiên & Cấp độ Cát Hung:
   1. Hào Thế (Hưng / Vượng, không bị Nhật/Nguyệt khắc, không bị suy bại: hóa khắc, hóa thoái, hóa tuyệt)
   2. Hào Thế LÀ Dụng Thần (Cầu sức khỏe/bình an): Hào động vượng tới sinh là TỐT NHẤT (mức vượng hào động phân cấp theo Nhật Nguyệt)
   3. Dụng Thần (Vượng tại Nhật/Nguyệt, Hóa tiến thần, Hóa hồi đầu sinh)
   4. Tương tác Dụng Thần & Hào Thế (Dụng thần động sinh Thế = Tốt nhất; Tài lai khắc Thế = Bắt buộc Thế vượng cả Nhật lẫn Nguyệt)
   ========================================================================== */

const ELEMENTS = ['Kim', 'Thủy', 'Mộc', 'Hỏa', 'Thổ'];

function isGenerating(elA, elB) {
    const idxA = ELEMENTS.indexOf(elA);
    const idxB = ELEMENTS.indexOf(elB);
    return (idxA + 1) % 5 === idxB;
}

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

const PURPOSE_NAMES = {
    'cautai': 'Cầu Tài Lộc',
    'cauquan': 'Cầu Công Danh / Sự Nghiệp',
    'suckhoe': 'Cầu Sức Khỏe & Bình An',
    'concai': 'Cầu Con Cái & Gia Đạo',
    'honnhan': 'Cầu Hôn Nhân & Tình Duyên'
};

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

// Đánh giá quẻ SIM nghiêm ngặt theo đúng phân cấp logic Dịch Học
function evaluateSimFengShui(simStr, hexData, cal, purpose, gender) {
    if (!hexData) return { isQualified: false, score: 0, grade: 'Không hợp lệ', reasons: ['Không thể lập quẻ.'] };

    const reasons = [];
    let score = 40;

    const nhatChi = cal.ngay.chi;
    const nhatHanh = cal.ngay.hanh;
    const nguyetChi = cal.thang.chi;
    const nguyetHanh = cal.thang.hanh;

    // --- 1. ĐÁNH GIÁ HÀO THẾ (Hưng / Vượng & An Toàn) ---
    const haoThe = hexData.linesData.find(l => l.isShi);
    if (!haoThe) {
        return { isQualified: false, score: 0, grade: 'Khắc', reasons: ['Không tìm thấy Hào Thế.'] };
    }

    const theHanh = haoThe.hanh;
    const theChi = haoThe.chi;

    // Kiểm tra SUY BẠI -> LOẠI BỎ NGAY
    const bịNhậtKhắc = isOvercoming(nhatHanh, theHanh);
    const bịNguyệtKhắc = isOvercoming(nguyetHanh, theHanh);

    if (bịNhậtKhắc || bịNguyệtKhắc) {
        return {
            isQualified: false,
            score: 10,
            grade: 'Hung (Thế Bị Khắc)',
            reasons: ['Hào Thế bị Nhật Thần hoặc Nguyệt Lệnh tương khắc (Suy vi, bỏ).']
        };
    }

    if (haoThe.isMoving) {
        const hoiDauKhac = isOvercoming(haoThe.changed.hanh, theHanh);
        const hoaThoai = isRegressingBranch(theChi, haoThe.changed.branch);
        const hoaTuyet = (getLifeStage(theHanh, haoThe.changed.branch) === 'Tuyệt');

        if (hoiDauKhac || hoaThoai || hoaTuyet) {
            let note = hoiDauKhac ? 'Hóa Hồi Đầu Khắc' : hoaThoai ? 'Hóa Thoái Thần' : 'Hóa Tuyệt';
            return {
                isQualified: false,
                score: 15,
                grade: 'Suy Bại',
                reasons: [`Hào Thế động ${note} (Thế suy bại, loại bỏ).`]
            };
        }
    }

    // Đánh giá cấp độ HƯNG / VƯỢNG của Hào Thế
    const isLamNhatNguyet = (theChi === nhatChi || theChi === nguyetChi);
    const isNguyetHop = isBranchHarmonious(theChi, nguyetChi);
    const isNhatHop = !haoThe.isMoving && isBranchHarmonious(theChi, nhatChi);
    const isNguyetSinhPho = (theHanh === nguyetHanh || isGenerating(nguyetHanh, theHanh));
    const isNhatSinhPho = (theHanh === nhatHanh || isGenerating(nhatHanh, theHanh));

    let theScore = 0;

    if (haoThe.isMoving) {
        // Hào Thế ĐỘNG
        const hoiDauSinh = isGenerating(haoThe.changed.hanh, theHanh);
        const hoaTien = isProgressingBranch(theChi, haoThe.changed.branch);

        if (hoiDauSinh || hoaTien) {
            let detail = hoaTien ? 'Hóa Tiến Thần' : 'Hóa Hồi Đầu Sinh';
            if (isLamNhatNguyet || isNguyetHop) {
                theScore = 40;
                reasons.push(`Hào Thế Động (${theChi}) Lâm/Hợp Nhật Nguyệt lại Động ${detail} - Đạt Cấp Cát Tường Tối Cao (Tốt hơn vượng tại Nhật Nguyệt).`);
            } else if (isNguyetSinhPho) {
                theScore = 35;
                reasons.push(`Hào Thế Động (${theChi}) được Nguyệt Lệnh sinh phò lại Động ${detail} (Cát Tường Bậc Cao).`);
            } else if (isNhatSinhPho) {
                theScore = 30;
                reasons.push(`Hào Thế Động (${theChi}) được Nhật Thần sinh phò lại Động ${detail} (Cát Tường Bậc Cao).`);
            } else {
                theScore = 25;
                reasons.push(`Hào Thế Động (${theChi}) ${detail} (Đạt Thế Hưng).`);
            }
        } else {
            if (isLamNhatNguyet || isNguyetHop) {
                theScore = 30;
                reasons.push(`Hào Thế Động (${theChi}) Lâm/Hợp Nhật Nguyệt vượng thế.`);
            } else if (isNguyetSinhPho) {
                theScore = 25;
                reasons.push(`Hào Thế Động (${theChi}) được Nguyệt Lệnh (${nguyetChi}) sinh phò.`);
            } else if (isNhatSinhPho) {
                theScore = 20;
                reasons.push(`Hào Thế Động (${theChi}) được Nhật Thần (${nhatChi}) sinh phò.`);
            }
        }
    } else {
        // Hào Thế TĨNH
        if (isLamNhatNguyet || isNguyetHop || isNhatHop) {
            theScore = 35;
            let note = isLamNhatNguyet ? 'Lâm Nhật/Nguyệt' : isNguyetHop ? 'Nguyệt Hợp' : 'Nhật Hợp';
            reasons.push(`Hào Thế Tĩnh (${theChi}) được ${note} (Thế Hưng - Cấp 1).`);
        } else if (isNguyetSinhPho) {
            theScore = 25;
            reasons.push(`Hào Thế Tĩnh (${theChi}) được Nguyệt Lệnh (${nguyetChi}) vượng sinh/phò (Thế Hưng - Cấp 2).`);
        } else if (isNhatSinhPho) {
            theScore = 20;
            reasons.push(`Hào Thế Tĩnh (${theChi}) được Nhật Thần (${nhatChi}) vượng sinh/phò (Thế Hưng - Cấp 3).`);
        } else {
            return {
                isQualified: false,
                score: 30,
                grade: 'Thế Suy',
                reasons: ['Hào Thế tĩnh không đạt thế Hưng tại Nhật Nguyệt (Bỏ).']
            };
        }
    }

    score += theScore;

    // --- 2. TRƯỜNG HỢP HÀO THẾ CŨNG LÀ DỤNG THẦN (Cầu Sức Khỏe / Thể Chất) ---
    const targetRel = getTargetRelation(purpose, gender);

    if (targetRel === 'Thế') {
        // Hào Thế làm Dụng Thần: Hào Động Vượng Tới Sinh là TỐT NHẤT
        let hasGeneratingDynamicLine = false;

        hexData.linesData.forEach(dLine => {
            if (dLine.isMoving && !dLine.isShi && isGenerating(dLine.hanh, theHanh)) {
                hasGeneratingDynamicLine = true;
                const dChi = dLine.chi;
                const dHanh = dLine.hanh;
                const isDongLamNhatNguyet = (dChi === nhatChi || dChi === nguyetChi);
                const isDongNguyetHop = isBranchHarmonious(dChi, nguyetChi);
                const isDongHoaTien = isProgressingBranch(dChi, dLine.changed.branch);
                const isDongHoiDauSinh = isGenerating(dLine.changed.hanh, dHanh);
                const isDongNguyetSinh = (dHanh === nguyetHanh || isGenerating(nguyetHanh, dHanh));
                const isDongNhatSinh = (dHanh === nhatHanh || isGenerating(nhatHanh, dHanh));

                if (isDongLamNhatNguyet || isDongNguyetHop || isDongHoaTien || isDongHoiDauSinh) {
                    score += 35;
                    reasons.push(`🔥 Hào Động (${dChi} - ${dHanh}) Vượng Tướng tại Nhật/Nguyệt (${isDongHoaTien ? 'Hóa Tiến Thần' : 'Lâm/Hợp Nhật Nguyệt'}) Sinh Hào Thế Dụng Thần (${theChi}) - Mẫu Quẻ Cát Tường Tối Cao cho Sức Khỏe & Bình An!`);
                } else if (isDongNguyetSinh) {
                    score += 28;
                    reasons.push(`🔥 Hào Động (${dChi} - ${dHanh}) được Nguyệt Lệnh sinh phò, Động Sinh Hào Thế Dụng Thần (${theChi}) - Đạt Cát Tường Bậc Cao.`);
                } else if (isDongNhatSinh) {
                    score += 22;
                    reasons.push(`🔥 Hào Động (${dChi} - ${dHanh}) được Nhật Thần sinh phò, Động Sinh Hào Thế Dụng Thần (${theChi}) - Đạt Cát Tường.`);
                } else {
                    score += 15;
                    reasons.push(`Hào Động (${dChi} - ${dHanh}) tương sinh Hào Thế Dụng Thần (${theChi}).`);
                }
            }
        });

        if (!hasGeneratingDynamicLine && !haoThe.isMoving) {
            reasons.push(`Hào Thế Dụng Thần (${theChi}) Tĩnh đạt thế Vượng Hưng tại Nhật/Nguyệt.`);
        }
    } else {
        // --- 3. ĐÁNH GIÁ DỤNG THẦN KHÁC (Thê Tài, Quan Quỷ, Tử Tôn) ---
        const dungThanLines = hexData.linesData.filter(l => l.relation.startsWith(targetRel));

        if (dungThanLines.length === 0) {
            return {
                isQualified: false,
                score: 20,
                grade: 'Khuyết Dụng Thần',
                reasons: [`Dụng Thần ${targetRel} không xuất hiện trong quẻ (Bỏ).`]
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
                    reasons.push(`🔥 Dụng Thần ${targetRel} (${dtChi}) ĐỘNG SINH HÀO THẾ (${theChi}) - Mẫu quẻ Cát Tường Bậc Nhất!`);
                }

                // CẦU TÀI: Dụng thần Thê Tài ĐỘNG KHẮC Hào Thế ("Tài Lai Khắc Thế")
                if (purpose === 'cautai' && isOvercoming(dtHanh, theHanh)) {
                    if (isNhatSinhPho && isNguyetSinhPho) {
                        dungThanKhacTheHopLe = true;
                        reasons.push(`Dụng Thần Thê Tài Động Khắc Hào Thế (Tài Lai Khắc Thế), Hào Thế Song Vượng (được cả Nhật Nguyệt sinh/phò) ➔ Nhận Được Đại Tài Lộc.`);
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
                    let note = dtHoaTien ? 'Hóa Tiến Thần' : 'Hóa Hồi Đầu Sinh';
                    if (dtLamNhatNguyet || dtNguyetHop) {
                        dungScore += 35;
                        reasons.push(`Dụng Thần ${targetRel} (${dtChi}) vượng Lâm/Hợp Nhật Nguyệt lại Động ${note} (Đại Cát).`);
                    } else if (dtNguyetSinh) {
                        dungScore += 30;
                        reasons.push(`Dụng Thần ${targetRel} (${dtChi}) vượng Nguyệt Lệnh lại Động ${note}.`);
                    } else {
                        dungScore += 25;
                        reasons.push(`Dụng Thần ${targetRel} (${dtChi}) Động ${note}.`);
                    }
                } else {
                    if (dtLamNhatNguyet || dtNguyetHop) dungScore += 25;
                    else if (dtNguyetSinh) dungScore += 20;
                }
            } else {
                // Tĩnh
                if (dtLamNhatNguyet || dtNguyetHop || dtNhatHop) {
                    dungScore += 30;
                    let note = dtLamNhatNguyet ? 'Lâm Nhật/Nguyệt' : dtNguyetHop ? 'Nguyệt Hợp' : 'Nhật Hợp';
                    reasons.push(`Dụng Thần ${targetRel} (${dtChi}) đạt thế Vượng Tướng (${note} - Cấp 1).`);
                } else if (dtNguyetSinh) {
                    dungScore += 20;
                    reasons.push(`Dụng Thần ${targetRel} (${dtChi}) được Nguyệt Lệnh (${nguyetChi}) vượng sinh (Cấp 2).`);
                } else if (dtNhatSinh) {
                    dungScore += 15;
                    reasons.push(`Dụng Thần ${targetRel} (${dtChi}) được Nhật Thần (${nhatChi}) vượng sinh (Cấp 3).`);
                }
            }
        });

        if (purpose === 'cautai') {
            const hasDtKhac = dungThanLines.some(dt => dt.isMoving && isOvercoming(dt.hanh, theHanh));
            if (hasDtKhac && !dungThanKhacTheHopLe) {
                return {
                    isQualified: false,
                    score: 25,
                    grade: 'Tài Khắc Thế Suy',
                    reasons: ['Tài lai khắc Thế nhưng Hào Thế không vượng ở cả Nhật lẫn Nguyệt (Loại bỏ).']
                };
            }
        }

        score += dungScore;
        if (dungThanDongSinhThe) score += 20;
    }

    // Đơn giản hóa lý do Quẻ Chủ
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
