/* ==========================================================================
   SIM PHONG THỦY ENGINE & EVALUATOR - CHUẨN ĐÃI LỌC DỊCH HỌC LỤC HÀO PRO
   Đánh giá chuẩn xác theo đúng quy tắc kiến thức Dịch Học:
   1. Phân cấp Vượng Suy Hào Tĩnh & Hào Động (Nhật hợp chỉ tính cho Hào Tĩnh)
   2. Hào Thế Hóa Cát vs Hào Thế Bại (Bại là bỏ 100%)
   3. Ưu tiên Hào Động tác dụng Dụng Thần trước -> Nguyên/Kỵ thần -> Hào Thế
   4. BẮT BUỘC: Dụng Thần vượng thì Hào Thế vượng mới có tác dụng (Dụng thần suy = Bỏ ngay)
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

function isBranchHarmonious(b1, b2) {
    const pairs = [
        ['Tý', 'Sửu'], ['Dần', 'Hợi'], ['Mão', 'Tuất'],
        ['Thìn', 'Dậu'], ['Tỵ', 'Thân'], ['Ngọ', 'Mùi']
    ];
    return pairs.some(([a, b]) => (a === b1 && b === b2) || (a === b2 && b === b1));
}

function isProgressingBranch(bMain, bChanged) {
    const prog = {
        'Dần': 'Mão', 'Tỵ': 'Ngọ', 'Thân': 'Dậu', 'Hợi': 'Tý',
        'Sửu': 'Thìn', 'Thìn': 'Mùi', 'Mùi': 'Tuất', 'Tuất': 'Sửu'
    };
    return prog[bMain] === bChanged;
}

function isRegressingBranch(bMain, bChanged) {
    const reg = {
        'Mão': 'Dần', 'Ngọ': 'Tỵ', 'Dậu': 'Thân', 'Tý': 'Hợi',
        'Thìn': 'Sửu', 'Mùi': 'Thìn', 'Tuất': 'Mùi', 'Sửu': 'Tuất'
    };
    return reg[bMain] === bChanged;
}

function getTargetRelation(purpose, gender) {
    switch (purpose) {
        case 'cautai': return 'Thê Tài';
        case 'cauquan': return 'Quan Quỷ';
        case 'suckhoe': return 'Thế';
        case 'concai': return 'Tử Tôn';
        case 'honnhan': return (gender === 'male') ? 'Thê Tài' : 'Quan Quỷ';
        default: return 'Thê Tài';
    }
}

// Xác định Lục Thân Nguyên Thần & Kỵ Thần theo Dụng Thần
function getNguyenAndKyThan(targetRel) {
    const rels = ['Huynh Đệ', 'Tử Tôn', 'Thê Tài', 'Quan Quỷ', 'Phụ Mẫu'];
    // Phụ Mẫu sinh Huynh Đệ -> Tử Tôn -> Thê Tài -> Quan Quỷ -> Phụ Mẫu
    const idx = rels.findIndex(r => r.startsWith(targetRel.split(' ')[0]));
    if (idx === -1) return { nguyenThan: '', kyThan: '' };

    const nguyenIdx = (idx - 1 + 5) % 5; // Lục thân sinh Dụng thần
    const kyIdx = (idx + 1) % 5;        // Lục thân khắc Dụng thần

    return {
        nguyenThan: rels[nguyenIdx],
        kyThan: rels[kyIdx]
    };
}

// Chấm điểm Mức độ Vượng Suy của 1 Hào (Theo Mục 1 Kiến Thức)
function getLineVungScore(line, cal) {
    const chi = line.chi;
    const hanh = line.hanh;
    const nhatChi = cal.ngay.chi;
    const nhatHanh = cal.ngay.hanh;
    const nguyetChi = cal.thang.chi;
    const nguyetHanh = cal.thang.hanh;

    const isLamNhatNguyet = (chi === nhatChi || chi === nguyetChi);
    const isNguyetHop = isBranchHarmonious(chi, nguyetChi);
    const isNhatHop = !line.isMoving && isBranchHarmonious(chi, nhatChi); // Nhật hợp CHỈ tính khi Hào Tĩnh
    const isNguyetSinhPho = (hanh === nguyetHanh || isGenerating(nguyetHanh, hanh));
    const isNhatSinhPho = (hanh === nhatHanh || isGenerating(nhatHanh, hanh));

    if (line.isMoving) {
        const hoiDauSinh = isGenerating(line.changed.hanh, hanh);
        const hoaTien = isProgressingBranch(chi, line.changed.branch);

        if (hoiDauSinh || hoaTien) {
            // Hóa Tiến / Hồi Đầu Sinh = TỐT NHẤT (Cao nhất)
            let base = 50;
            if (isLamNhatNguyet || isNguyetHop) base += 20;
            else if (isNguyetSinhPho) base += 15;
            else if (isNhatSinhPho) base += 10;
            return { score: base, note: `Động ${hoaTien ? 'Hóa Tiến Thần' : 'Hóa Hồi Đầu Sinh'} (Tối Cát)` };
        } else {
            if (isLamNhatNguyet || isNguyetHop) return { score: 35, note: 'Lâm/Hợp Nhật Nguyệt' };
            if (isNguyetSinhPho) return { score: 28, note: 'Nguyệt Lệnh sinh phò' };
            if (isNhatSinhPho) return { score: 20, note: 'Nhật Thần sinh phò' };
            return { score: 10, note: 'Động' };
        }
    } else {
        // Hào TĨNH
        if (isLamNhatNguyet || isNguyetHop || isNhatHop) {
            let note = isLamNhatNguyet ? 'Lâm Nhật/Nguyệt' : isNguyetHop ? 'Nguyệt Hợp' : 'Nhật Hợp';
            return { score: 40, note: `${note} (Cấp 1 - Vượng)` };
        }
        if (isNguyetSinhPho) return { score: 30, note: 'Nguyệt Lệnh vượng sinh/phò (Cấp 2)' };
        if (isNhatSinhPho) return { score: 20, note: 'Nhật Thần vượng sinh/phò (Cấp 3)' };
        return { score: 0, note: 'Suy Tĩnh' };
    }
}

// Đánh giá SIM theo toàn bộ quy tắc Dịch Học Lục Hào Pro
function evaluateSimFengShui(simStr, hexData, cal, purpose, gender) {
    if (!hexData) return { isQualified: false, score: 0, grade: 'Không hợp lệ', reasons: ['Không thể lập quẻ.'] };

    const reasons = [];
    let totalScore = 40;

    const nhatHanh = cal.ngay.hanh;
    const nguyetHanh = cal.thang.hanh;

    // 1. LẤY HÀO THẾ & DỤNG THẦN
    const haoThe = hexData.linesData.find(l => l.isShi);
    if (!haoThe) {
        return { isQualified: false, score: 0, grade: 'Khắc', reasons: ['Không tìm thấy Hào Thế.'] };
    }

    const theHanh = haoThe.hanh;
    const theChi = haoThe.chi;

    // --- KIỂM TRA HÀO THẾ BẠI (BẮT BUỘC LOẠI BỎ 100%) ---
    const bịNhậtKhắc = isOvercoming(nhatHanh, theHanh);
    const bịNguyệtKhắc = isOvercoming(nguyetHanh, theHanh);
    if (bịNhậtKhắc || bịNguyệtKhắc) {
        return {
            isQualified: false,
            score: 10,
            grade: 'Hung (Thế Bị Khắc)',
            reasons: ['Hào Thế bị Nhật Thần hoặc Nguyệt Lệnh tương khắc (Thế suy bại, loại bỏ).']
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
                grade: 'Thế Suy Bại',
                reasons: [`Hào Thế động ${note} (Thuộc thế bại, bắt buộc loại bỏ).`]
            };
        }
    }

    // --- 2. ĐÁNH GIÁ VƯỢNG SUY DỤNG THẦN (CỐT LÕI BẮT BUỘC) ---
    const targetRel = getTargetRelation(purpose, gender);
    const { nguyenThan, kyThan } = getNguyenAndKyThan(targetRel);

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
            reasons: [`Dụng Thần ${targetRel} không xuất hiện trong quẻ (Bỏ).`]
        };
    }

    // Tính điểm Vượng Suy Dụng Thần
    let maxDungScore = 0;
    let maxDungNote = '';
    let dungThanBestLine = null;

    dungThanLines.forEach(dt => {
        const vInfo = getLineVungScore(dt, cal);
        if (vInfo.score > maxDungScore) {
            maxDungScore = vInfo.score;
            maxDungNote = vInfo.note;
            dungThanBestLine = dt;
        }
    });

    // Kiểm tra xem Dụng Thần có được Hào Động nào sinh không
    let dungThanDuocDongSinh = false;
    hexData.linesData.forEach(dLine => {
        if (dLine.isMoving && dungThanLines.some(dt => isGenerating(dLine.hanh, dt.hanh))) {
            dungThanDuocDongSinh = true;
            const dVung = getLineVungScore(dLine, cal);
            reasons.push(`🔥 Hào Động (${dLine.chi} - ${dLine.hanh}) [${dVung.note}] ĐỘNG SINH DỤNG THẦN (${targetRel}) - Lực tác dụng mạnh hơn Nhật Nguyệt (Đại Cát).`);
        }
    });

    // BẮT BUỘC: Dụng Thần phải Vượng (hoặc được Hào Động sinh). Dụng thần suy => BỎ NGAY!
    if (maxDungScore <= 0 && !dungThanDuocDongSinh) {
        return {
            isQualified: false,
            score: 25,
            grade: 'Dụng Thần Suy',
            reasons: [`Dụng Thần ${targetRel} bị suy vi tại Nhật Nguyệt và không có Hào Động sinh phò (Dụng Thần Suy thì Hào Thế vượng cũng HUNG, loại bỏ).`]
        };
    }

    if (maxDungScore > 0) {
        reasons.push(`Dụng Thần ${targetRel} (${dungThanBestLine.chi}) đạt thế Vượng: ${maxDungNote}.`);
    }

    totalScore += maxDungScore;

    // --- 3. ĐÁNH GIÁ HÀO THẾ VƯỢNG SUY & HÓA CÁT ---
    const theVungInfo = getLineVungScore(haoThe, cal);
    totalScore += theVungInfo.score;

    if (haoThe.isMoving) {
        const hoiDauSinhDung = dungThanLines.some(dt => haoThe.changed.relation.startsWith(dt.relation.split(' ')[0]) && isGenerating(haoThe.changed.hanh, theHanh));
        const hoaTien = isProgressingBranch(theChi, haoThe.changed.branch);
        const hoaDungThan = dungThanLines.some(dt => haoThe.changed.relation.startsWith(dt.relation.split(' ')[0]));

        if (hoiDauSinhDung) {
            totalScore += 30;
            reasons.push(`🌟 Hào Thế Động Hóa Ra Dụng Thần (${targetRel}) Hồi Đầu Sinh (Mẫu quẻ Cát Tường Cấp 1).`);
        } else if (hoaTien) {
            totalScore += 25;
            reasons.push(`✨ Hào Thế Động Hóa Tiến Thần (${haoThe.changed.branch}) - Cát Tường Cấp 2.`);
        } else if (hoaDungThan) {
            totalScore += 20;
            reasons.push(`Hào Thế Động Hóa Ra Dụng Thần (${targetRel}) - Cát Tường Cấp 3.`);
        }
    } else {
        reasons.push(`Hào Thế Tĩnh (${theChi}) Vượng Hưng: ${theVungInfo.note}.`);
    }

    // --- 4. TRƯỜNG HỢP HÀO THẾ LÀ DỤNG THẦN (Cầu Sức Khỏe) ---
    if (targetRel === 'Thế') {
        let hasGenDynamic = false;
        hexData.linesData.forEach(dL => {
            if (dL.isMoving && !dL.isShi && isGenerating(dL.hanh, theHanh)) {
                hasGenDynamic = true;
                const dV = getLineVungScore(dL, cal);
                totalScore += 25;
                reasons.push(`🔥 Hào Động (${dL.chi} - ${dL.hanh}) [${dV.note}] ĐỘNG SINH HÀO THẾ DỤNG THẦN (${theChi}) - Mẫu quẻ Cát Tường Tối Cao cho Sức Khỏe!`);
            }
        });
        if (!hasGenDynamic && haoThe.isMoving) {
            reasons.push(`Hào Thế Dụng Thần (${theChi}) Động Hóa Cát Tường.`);
        }
    } else {
        // --- 5. TƯƠNG TÁC HÀO ĐỘNG VỚI HÀO THẾ & NGUYÊN/KỴ THẦN ---
        let dungThanDongSinhThe = false;

        hexData.linesData.forEach(dL => {
            if (dL.isMoving) {
                // Hào Động Sinh Thế -> TỐT NHẤT
                if (isGenerating(dL.hanh, theHanh)) {
                    dungThanDongSinhThe = true;
                    totalScore += 25;
                    reasons.push(`🔥 Hào Động (${dL.chi} - ${dL.hanh}) ĐỘNG SINH HÀO THẾ (${theChi}) - Mẫu quẻ Cát Tường Bậc Nhất!`);
                }

                // Tương tác tới Nguyên Thần / Kỵ Thần
                if (dL.relation.startsWith(nguyenThan.split(' ')[0])) {
                    totalScore += 15;
                    reasons.push(`Hào Động (${dL.chi}) làm Nguyên Thần tương trợ Dụng Thần (${targetRel}).`);
                }
            }
        });

        // Xử lý CẦU TÀI: Thê Tài Động Khắc Thế (Tài Lai Khắc Thế)
        if (purpose === 'cautai') {
            const dtKhacThe = dungThanLines.find(dt => dt.isMoving && isOvercoming(dt.hanh, theHanh));
            if (dtKhacThe) {
                const theNhatSinh = (theHanh === nhatHanh || isGenerating(nhatHanh, theHanh));
                const theNguyetSinh = (theHanh === nguyetHanh || isGenerating(nguyetHanh, theHanh));

                if (theNhatSinh && theNguyetSinh) {
                    totalScore += 20;
                    reasons.push(`Dụng Thần Thê Tài Động Khắc Hào Thế (Tài Lai Khắc Thế), Hào Thế Song Vượng ở cả Nhật lẫn Nguyệt ➔ Nhận Được Đại Tài Lộc.`);
                } else {
                    return {
                        isQualified: false,
                        score: 20,
                        grade: 'Tài Khắc Thế Suy',
                        reasons: ['Tài lai khắc Thế nhưng Hào Thế không vượng ở cả Nhật lẫn Nguyệt (Bỏ).']
                    };
                }
            }
        }
    }

    // Đơn giản hóa lý do Quẻ Chủ
    const mainName = hexData.mainName;
    if (mainName.includes('Thái') || mainName.includes('Trung Phu') || mainName.includes('Đại Hữu') || mainName.includes('Gia Nhân') || mainName.includes('Ích') || mainName.includes('Tụy')) {
        totalScore += 10;
        reasons.push(`Quẻ Chủ ${mainName} thuộc Đại Cát Quẻ.`);
    }

    totalScore = Math.min(100, Math.max(0, totalScore));

    let grade = 'Đại Cát';
    if (totalScore >= 90) grade = 'Đại Cát (Top 1)';
    else if (totalScore >= 85) grade = 'Thượng Cát';
    else if (totalScore >= 75) grade = 'Trung Cát';
    else grade = 'Cát Tường';

    return {
        isQualified: totalScore >= 70,
        score: totalScore,
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
