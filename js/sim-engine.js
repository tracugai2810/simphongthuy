/* ==========================================================================
   SIM PHONG THỦY ENGINE & EVALUATOR - CHUẨN ĐÃI LỌC DỊCH HỌC LỤC HÀO PRO
   ==========================================================================
   BỔ SUNG QUY TẮC NGUYÊN LÝ DỊCH HỌC UYÊN THÂM:
   1. HÀO ĐỘNG HÓA SUY BẠI:
      - Gồm 4 trường hợp: Hóa hồi đầu khắc, Hóa thoái thần, Hóa tuyệt, Hóa phá (hào biến bị nhật xung hoặc nguyệt xung).
      - Nếu Dụng Thần hoặc Nguyên Thần (cái sinh cho Dụng Thần) động hóa suy bại ➔ Đều là XẤU, BỎ (Loại bỏ 100%).
      - Riêng Hào Thế động: Chỉ có Hóa hồi đầu khắc, Hóa thoái thần, Hóa tuyệt mới tính là XẤU (Hóa phá đơn thuần không tự động loại trừ Hào Thế).

   2. KỊ THẦN (CÁI KHẮC DỤNG THẦN / NGUYÊN THẦN / HÀO THẾ):
      - Nếu Kỵ Thần hóa hồi đầu sinh, hóa tiến thần, hóa nguyệt/nhật (lâm nhật hoặc nguyệt) hoặc đơn giản là KHÔNG hóa suy bại ➔ Đều là Hào Động HỮU DỤNG & VƯỢNG.
      - Khi Kỵ Thần vượng hữu dụng ➔ Khắc Dụng/Nguyên/Thế ➔ XẤU (Hung bại, Loại bỏ 100%).
      - Ngược lại, nếu Kỵ Thần động Hóa Suy Bại hoặc Vô Dụng ➔ Kỵ Thần bị vô hiệu hóa, không thể gây hại ➔ CÁT.

   3. VƯỢNG VÀ VÔ DỤNG CỦA HÀO ĐỘNG:
      - Tất cả các hào động, chỉ cần không hóa suy bại ➔ Đều là VƯỢNG.
      - Duy nhất trường hợp bị Nguyệt xung phá LẠI Nhập Mộ tại Nhật ➔ Mới là Hào động VÔ DỤNG.
      - Tùy theo là Dụng Thần, Nguyên Thần (thành Vô Dụng ➔ Xấu) hay Kỵ Thần (thành Vô Dụng ➔ Cát) mà định Cát / Hung.
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

function isBranchXung(b1, b2) {
    const pairs = [
        ['Tý', 'Ngọ'], ['Sửu', 'Mùi'], ['Dần', 'Thân'],
        ['Mão', 'Dậu'], ['Thìn', 'Tuất'], ['Tỵ', 'Hợi']
    ];
    return pairs.some(([a, b]) => (a === b1 && b === b2) || (a === b2 && b === b1));
}

// Tiến thần: Dần->Mão, Tị->Ngọ, Thân->Dậu, Hợi->Tý, Sửu->Thìn, Thìn->Mùi, Mùi->Tuất, Tuất->Sửu
function isProgressingBranch(bMain, bChanged) {
    const prog = {
        'Dần': 'Mão', 'Tỵ': 'Ngọ', 'Thân': 'Dậu', 'Hợi': 'Tý',
        'Sửu': 'Thìn', 'Thìn': 'Mùi', 'Mùi': 'Tuất', 'Tuất': 'Sửu'
    };
    return prog[bMain] === bChanged;
}

// Thoái thần: Mão->Dần, Ngọ->Tị, Dậu->Thân, Tý->Hợi, Thìn->Sửu, Mùi->Thìn, Tuất->Mùi, Sửu->Tuất
function isRegressingBranch(bMain, bChanged) {
    const reg = {
        'Mão': 'Dần', 'Ngọ': 'Tỵ', 'Dậu': 'Thân', 'Tý': 'Hợi',
        'Thìn': 'Sửu', 'Mùi': 'Thìn', 'Tuất': 'Mùi', 'Sửu': 'Tuất'
    };
    return reg[bMain] === bChanged;
}

// Mộ chi theo Ngũ Hành
function getTombBranch(hanh) {
    switch (hanh) {
        case 'Mộc': return 'Mùi';
        case 'Hỏa': return 'Tuất';
        case 'Kim': return 'Sửu';
        case 'Thủy':
        case 'Thổ': return 'Thìn';
        default: return 'Thìn';
    }
}

// Xác định Dụng Thần theo Mục Đích Cầu
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

// Xác định Nguyên Thần (Sinh Dụng Thần) và Kỵ Thần (Khắc Dụng Thần)
function getNguyenAndKyThan(targetRel) {
    const rels = ['Huynh Đệ', 'Tử Tôn', 'Thê Tài', 'Quan Quỷ', 'Phụ Mẫu'];
    const idx = rels.findIndex(r => r.startsWith(targetRel.split(' ')[0]));
    if (idx === -1) return { nguyenThan: '', kyThan: '' };

    const nguyenIdx = (idx - 1 + 5) % 5;
    const kyIdx = (idx + 1) % 5;

    return {
        nguyenThan: rels[nguyenIdx],
        kyThan: rels[kyIdx]
    };
}

/* ==========================================================================
   HÀM KIỂM TRA HÀO ĐỘNG HÓA SUY BẠI / VÔ DỤNG THEO NGUYÊN LÝ DỊCH HỌC UYÊN THÂM
   ========================================================================== */

// 1. Hào Động Hóa Suy Bại: Gồm 4 TH (Hóa hồi đầu khắc, Hóa thoái thần, Hóa tuyệt, Hóa phá)
function isHoaSuyBai(line, cal) {
    if (!line || !line.isMoving || !line.changed) return false;

    const chiMain = line.chi || line.branch;
    const hanhMain = line.hanh;
    const chiChanged = line.changed.branch;
    const hanhChanged = line.changed.hanh;

    const hoiDauKhac = isOvercoming(hanhChanged, hanhMain);
    const hoaThoai = isRegressingBranch(chiMain, chiChanged);
    const hoaTuyet = (getLifeStage(hanhMain, chiChanged) === 'Tuyệt');
    const hoaPha = isBranchXung(chiChanged, cal.thang.chi) || isBranchXung(chiChanged, cal.ngay.chi);

    return (hoiDauKhac || hoaThoai || hoaTuyet || hoaPha);
}

// 2. Riêng Hào Thế Hóa Suy Bại: Chỉ gồm Hóa hồi đầu khắc, Hóa thoái thần, Hóa tuyệt
function isHaoTheHoaSuyBai(line) {
    if (!line || !line.isMoving || !line.changed) return false;

    const chiMain = line.chi || line.branch;
    const hanhMain = line.hanh;
    const chiChanged = line.changed.branch;
    const hanhChanged = line.changed.hanh;

    const hoiDauKhac = isOvercoming(hanhChanged, hanhMain);
    const hoaThoai = isRegressingBranch(chiMain, chiChanged);
    const hoaTuyet = (getLifeStage(hanhMain, chiChanged) === 'Tuyệt');

    return (hoiDauKhac || hoaThoai || hoaTuyet);
}

// 3. Hào Động Vô Dụng: Duy nhất bị Nguyệt xung phá LẠI Nhập Mộ tại Nhật
function isMovingLineVoDung(line, cal) {
    if (!line || !line.isMoving) return false;

    const chiMain = line.chi || line.branch;
    const hanhMain = line.hanh;

    const isNguyetPha = isBranchXung(chiMain, cal.thang.chi);
    const tombBranch = getTombBranch(hanhMain);
    const isNhatMo = (cal.ngay.chi === tombBranch);

    return (isNguyetPha && isNhatMo);
}

// 4. Kỵ Thần Hữu Dụng & Vượng: Không Hóa Suy Bại, hoặc Hóa Hồi Đầu Sinh, Hóa Tiến Thần, Hóa Nguyệt/Nhật
function isKyThanHuuDung(line, cal) {
    if (!line || !line.isMoving) return false;

    // Nếu Kỵ Thần bị Vô Dụng (Nguyệt phá + Nhật mộ) hoặc Hóa Suy Bại -> Kỵ Thần bị vô hiệu hóa (không gây hại được)
    if (isMovingLineVoDung(line, cal) || isHoaSuyBai(line, cal)) {
        return false;
    }

    const chiMain = line.chi || line.branch;
    const hanhMain = line.hanh;
    const chiChanged = line.changed ? line.changed.branch : '';
    const hanhChanged = line.changed ? line.changed.hanh : '';

    const hoiDauSinh = line.changed ? isGenerating(hanhChanged, hanhMain) : false;
    const hoaTien = line.changed ? isProgressingBranch(chiMain, chiChanged) : false;
    const hoaNguyetNhat = (chiChanged === cal.thang.chi || chiChanged === cal.ngay.chi);

    return (hoiDauSinh || hoaTien || hoaNguyetNhat || !isHoaSuyBai(line, cal));
}

/* ==========================================================================
   HÀM TÍNH MỨC ĐỘ VƯỢNG SUY, KHÔNG VONG & NHẬP MỘ CỦA HÀO
   ========================================================================== */
function getLineVungScore(line, cal, hexData = null) {
    const chi = line.chi || line.branch;
    const hanh = line.hanh;
    const nhatChi = cal.ngay.chi;
    const nhatHanh = cal.ngay.hanh;
    const nguyetChi = cal.thang.chi;
    const nguyetHanh = cal.thang.hanh;

    const isLamNhatNguyet = (chi === nhatChi || chi === nguyetChi);
    const isNguyetHop = isBranchHarmonious(chi, nguyetChi);
    const isNhatHop = !line.isMoving && isBranchHarmonious(chi, nhatChi);
    const isNguyetSinhPho = (hanh === nguyetHanh || isGenerating(nguyetHanh, hanh));
    const isNhatSinhPho = (hanh === nhatHanh || isGenerating(nhatHanh, hanh));

    const isNguyetXung = isBranchXung(chi, nguyetChi);
    const isNhatXung = isBranchXung(chi, nhatChi);
    const isTK = line.isTK || false;

    const tombBranch = getTombBranch(hanh);
    const isNhatMo = (nhatChi === tombBranch);
    const isHoaMo = line.isMoving && line.changed && (line.changed.branch === tombBranch);
    let isDongMo = false;
    if (hexData && hexData.linesData) {
        isDongMo = hexData.linesData.some(dL => dL.isMoving && dL.chi === tombBranch);
    }
    const isMo = (isNhatMo || isHoaMo || isDongMo);

    if (line.isMoving) {
        // Trường hợp duy nhất Hào Động Vô Dụng: Nguyệt phá + Mộ tại Nhật
        if (isMovingLineVoDung(line, cal)) {
            return { score: 0, isVung: false, isVoDung: true, note: 'Tùy Nguyệt Phá Nhập Nhật Mộ - Vô dụng hoàn toàn' };
        }

        const hoiDauSinh = line.changed ? isGenerating(line.changed.hanh, hanh) : false;
        const hoaTien = line.changed ? isProgressingBranch(chi, line.changed.branch) : false;

        if (hoiDauSinh || hoaTien) {
            let baseScore = 50;
            if (isLamNhatNguyet || isNguyetHop) baseScore += 20;
            else if (isNguyetSinhPho) baseScore += 15;
            else if (isNhatSinhPho) baseScore += 10;

            if (isNguyetXung || isNhatXung || isTK || isMo) baseScore -= 10;
            return {
                score: baseScore,
                isVung: true,
                note: `Động hóa sinh trợ vượng khí${isMo ? ' (Động Nhập Mộ - Không sao)' : ''}`
            };
        } else {
            if (isHoaSuyBai(line, cal)) {
                return { score: 0, isVung: false, isSuyBai: true, note: 'Động Hóa Suy Bại (Hồi đầu khắc / Thoái / Tuyệt / Phá)' };
            }

            // Tất cả các hào động, chỉ cần không hóa suy bại -> đều là vượng
            if (isLamNhatNguyet || isNguyetHop) return { score: 35, isVung: true, note: 'Lâm/Hợp Nhật Nguyệt vượng khí' };
            if (isNguyetSinhPho) return { score: 30, isVung: true, note: 'Nguyệt Lệnh sinh phò vượng khí' };
            
            return { score: 25, isVung: true, note: 'Hào động không hóa suy bại (Hữu dụng vượng khí)' };
        }
    } else {
        const isStaticVung = (isLamNhatNguyet || isNguyetHop || isNhatHop || isNguyetSinhPho);

        if (isNguyetXung) {
            return { score: 0, isVung: false, isXungPha: true, note: 'Bị Nguyệt Xung (Nguyệt Phá - Xấu nặng)' };
        }
        if (isNhatXung) {
            return { score: 0, isVung: false, isXungPha: true, note: 'Bị Nhật Xung (Ám Xung - Suy hưu tù)' };
        }

        if (isMo) {
            if (isStaticVung) {
                return { score: 30, isVung: true, isGiaMo: true, note: 'Tĩnh Nhập Mộ nhưng Vượng (Mộ Vượng - Vẫn vượng khí Cát)' };
            } else {
                return { score: 0, isVung: false, isChanMo: true, note: 'Tĩnh Nhập Mộ bị Hưu Tù (Mộ Hưu Tù - Xấu nặng)' };
            }
        }

        if (isTK) {
            if (isStaticVung) {
                return { score: 30, isVung: true, isGiaKhong: true, note: 'Tĩnh Không Vong nhưng Vượng (Giả Không - Vượng khí Cát)' };
            } else {
                return { score: 0, isVung: false, isChanKhong: true, note: 'Tĩnh Không Vong bị Hưu Tù (Chân Không - Xấu nặng)' };
            }
        }

        if (isLamNhatNguyet || isNguyetHop || isNhatHop) {
            return { score: 40, isVung: true, note: `Được Nhật Nguyệt sinh trợ vượng khí rất tốt` };
        }
        if (isNguyetSinhPho) return { score: 30, isVung: true, note: 'Nguyệt Lệnh sinh phò vượng khí' };
        if (isNhatSinhPho) {
            return { score: 20, isVung: false, note: 'Nhật Thần sinh phò' };
        }
        return { score: 0, isVung: false, note: 'Bị suy vi' };
    }
}

/* ==========================================================================
   HÀM TÌM DỤNG THẦN TỐI ƯU THEO THỨ TỰ UYÊN THÂM 5 BẬC
   ========================================================================== */
function findBestDungThanCandidate(hexData, cal, targetRel) {
    const nhatChi = cal.ngay.chi;
    const nguyetChi = cal.thang.chi;
    const candidates = [];

    // 1. Quẻ chính
    hexData.linesData.forEach((l, idx) => {
        if (l.relation.startsWith(targetRel)) {
            candidates.push({
                source: 'main',
                line: l,
                lineIdx: idx,
                chi: l.chi,
                hanh: l.hanh,
                isShi: l.isShi,
                isYing: l.isYing,
                isMoving: l.isMoving,
                isClashed: isBranchXung(l.chi, nhatChi) || isBranchXung(l.chi, nguyetChi),
                isHarmonious: isBranchHarmonious(l.chi, nhatChi) || isBranchHarmonious(l.chi, nguyetChi),
                isTK: l.isTK,
                isLamNhatNguyet: (l.chi === nhatChi || l.chi === nguyetChi)
            });
        }
    });

    // 2. Hào biến
    hexData.linesData.forEach((l, idx) => {
        if (l.isMoving && l.changed && l.changed.relation.startsWith(targetRel)) {
            candidates.push({
                source: 'changed',
                parentLine: l,
                lineIdx: idx,
                chi: l.changed.branch,
                hanh: l.changed.hanh,
                isMoving: true,
                isClashed: isBranchXung(l.changed.branch, nhatChi) || isBranchXung(l.changed.branch, nguyetChi),
                isHarmonious: isBranchHarmonious(l.changed.branch, nhatChi) || isBranchHarmonious(l.changed.branch, nguyetChi),
                isLamNhatNguyet: (l.changed.branch === nhatChi || l.changed.branch === nguyetChi)
            });
        }
    });

    // 3. Phục thần
    hexData.linesData.forEach((l, idx) => {
        if (l.phucThan && l.phucThan.rel.startsWith(targetRel)) {
            const ptHanh = l.phucThan.hanh;
            candidates.push({
                source: 'phucThan',
                phucThan: l.phucThan,
                phiThan: l,
                lineIdx: idx,
                chi: l.phucThan.branch,
                hanh: ptHanh,
                isMoving: false,
                isTK: isTuanKhong(cal.ngay.can, cal.ngay.chi, l.phucThan.branch)
            });
        }
    });

    if (candidates.length === 0) return null;
    if (candidates.length === 1) return candidates[0];

    // Sắp xếp theo ưu tiên 5 cấp bậc
    candidates.sort((a, b) => {
        const getPriorityScore = (c) => {
            let p = 0;
            if (c.isShi || c.isYing) p += 500;
            if (c.isMoving) p += 300;
            if (c.source === 'changed') p += 250;
            if (c.isClashed || c.isHarmonious || c.isTK) p += 150;
            if (c.isLamNhatNguyet) p += 100;
            if (c.source === 'phucThan') p += 10;
            return p;
        };
        return getPriorityScore(b) - getPriorityScore(a);
    });

    return candidates[0];
}

/* ==========================================================================
   HÀM ĐÁNH GIÁ PHONG THỦY LỤC HÀO SIM TỔNG THỂ (ĐÃ CẬP NHẬT CHUẨN DỊCH HỌC PRO)
   ========================================================================== */
function evaluateSimFengShui(simNumber, hexData, cal, purpose, gender) {
    let totalScore = 0;
    const reasons = [];

    const nhatChi = cal.ngay.chi;
    const nhatHanh = cal.ngay.hanh;
    const nguyetChi = cal.thang.chi;
    const nguyetHanh = cal.thang.hanh;

    const haoThe = hexData.linesData.find(l => l.isShi);
    if (!haoThe) {
        return { isQualified: false, score: 0, grade: 'Khắc', reasons: ['Không tìm thấy Hào Thế.'] };
    }

    const theHanh = haoThe.hanh;
    const theChi = haoThe.chi;

    const targetRel = getTargetRelation(purpose, gender);
    const { nguyenThan, kyThan } = getNguyenAndKyThan(targetRel);
    const dtRelPrefix = targetRel.split(' ')[0];
    const kyRelPrefix = kyThan ? kyThan.split(' ')[0] : '';
    const nguyenRelPrefix = nguyenThan ? nguyenThan.split(' ')[0] : '';

    // 1. TÌM DỤNG THẦN THEO CHUẨN ƯU TIÊN 5 CẤP BẬC
    let bestCand = null;
    if (targetRel === 'Thế') {
        bestCand = {
            source: 'main',
            line: haoThe,
            chi: haoThe.chi,
            hanh: haoThe.hanh,
            isShi: true,
            isMoving: haoThe.isMoving
        };
    } else {
        bestCand = findBestDungThanCandidate(hexData, cal, targetRel);
    }

    if (!bestCand) {
        return {
            isQualified: false,
            score: 15,
            grade: 'Khuyết Dụng Thần',
            reasons: [`Dụng Thần (${targetRel}) không xuất hiện trong quẻ (Thiếu yếu tố may mắn cầu như ý).`]
        };
    }

    let dungThanIsVung = false;
    let dungThanScore = 0;
    let dungThanNote = '';

    // 2. ĐÁNH GIÁ DỤNG THẦN & NGUYÊN THẦN
    if (bestCand.source === 'phucThan') {
        const pt = bestCand.phucThan;
        const phi = bestCand.phiThan;

        const ptIsNguyetPha = isBranchXung(pt.branch, nguyetChi);
        const ptIsNhatPha = isBranchXung(pt.branch, nhatChi);
        if (bestCand.isTK || ptIsNguyetPha || ptIsNhatPha) {
            return {
                isQualified: false,
                score: 15,
                grade: 'Phục Thần Suy Bại',
                reasons: [`Dụng Thần ở Phục Thần bị Không Vong hoặc Nguyệt/Nhật Phá (Suy bại hoàn toàn, loại bỏ 100%).`]
            };
        }

        const phiVung = getLineVungScore(phi, cal, hexData);
        const ptSinhPhi = isGenerating(pt.hanh, phi.hanh);
        const phiSinhPt = isGenerating(phi.hanh, pt.hanh);

        if (ptSinhPhi) {
            const phiBiDongKhac = hexData.linesData.some(dL => dL.isMoving && isOvercoming(dL.hanh, phi.hanh));
            const ptIsNguyetVung = (pt.hanh === nguyetHanh || isGenerating(nguyetHanh, pt.hanh) || pt.branch === nhatChi || pt.branch === nguyetChi || isBranchHarmonious(pt.branch, nguyetChi));
            const phiKhacPt = isOvercoming(phi.hanh, pt.hanh);
            const phiXungPt = isBranchXung(phi.branch, pt.branch);

            if ((phi.isMoving && !phiVung.isVung) || phiBiDongKhac) {
                dungThanIsVung = true;
                dungThanScore = 35;
                dungThanNote = 'Phục Thần xuất khí thoát tiết, vượng tướng Cát tường';
            } else if (!phi.isMoving && ptIsNguyetVung && !phiKhacPt && !phiXungPt) {
                dungThanIsVung = true;
                dungThanScore = 30;
                dungThanNote = 'Phục Thần vượng tướng tại Nguyệt Lệnh & không bị Phi Thần tĩnh khắc/phá';
            } else {
                return {
                    isQualified: false,
                    score: 15,
                    grade: 'Phục Thần Suy Bại',
                    reasons: [`Phục Thần (${pt.branch}) bị tiết khí và không đạt vượng tướng tại Nguyệt Lệnh hoặc bị Phi Thần khắc phá.`]
                };
            }
        } else if (phiSinhPt) {
            if (phiVung.isVung) {
                dungThanIsVung = true;
                dungThanScore = 40;
                dungThanNote = 'Phi Thần sinh Phục Thần (Trường Sinh vượng khí)';
            } else {
                return {
                    isQualified: false,
                    score: 15,
                    grade: 'Phi Thần Suy',
                    reasons: [`Dụng Thần Phục Thần được Phi Thần sinh nhưng Phi Thần suy vi (Không sinh nổi Phục Thần).`]
                };
            }
        } else {
            const ptIsNguyetVung = (pt.hanh === nguyetHanh || isGenerating(nguyetHanh, pt.hanh) || pt.branch === nhatChi || pt.branch === nguyetChi || isBranchHarmonious(pt.branch, nguyetChi));
            const phiKhacPt = isOvercoming(phi.hanh, pt.hanh);
            const phiXungPt = isBranchXung(phi.branch, pt.branch);

            if (phiVung.isVung && ptIsNguyetVung && !phiKhacPt && !phiXungPt) {
                dungThanIsVung = true;
                dungThanScore = 30;
                dungThanNote = 'Phục Thần & Phi Thần đều vượng khí';
            } else {
                return {
                    isQualified: false,
                    score: 15,
                    grade: 'Phục Thần Suy',
                    reasons: [`Dụng Thần ở Phục Thần bị suy vi tại Phi Thần.`]
                };
            }
        }

        reasons.push(`Dụng Thần ở Phục Thần (${pt.branch}) đắc lực: ${dungThanNote}.`);
    } else if (bestCand.source === 'changed') {
        const parentL = bestCand.parentLine;

        // Nếu Hào Động sinh ra Dụng Thần ở Hào Biến bị Hóa Suy Bại hoặc Vô Dụng -> Loại bỏ 100%
        if (isHoaSuyBai(parentL, cal) || isMovingLineVoDung(parentL, cal)) {
            return {
                isQualified: false,
                score: 15,
                grade: 'Dụng Thần Biến Suy Bại',
                reasons: [`Dụng Thần ở Hào Biến bị Hào Động sinh ra nó động Hóa Suy Bại hoặc Vô Dụng (Loại bỏ 100%).`]
            };
        }

        dungThanIsVung = true;
        dungThanScore = 40;
        dungThanNote = 'Dụng Thần ở Hào Biến được Hào Động vượng sinh ra (Vượng khí rất tốt)';
        reasons.push(`Dụng Thần ở Hào Biến (${bestCand.chi}) vượng khí: ${dungThanNote}.`);
    } else {
        const dtLine = bestCand.line;

        // A. Kiểm tra Dụng Thần bị VÔ DỤNG (Nguyệt xung phá LẠI nhập Mộ tại Nhật)
        if (isMovingLineVoDung(dtLine, cal)) {
            return {
                isQualified: false,
                score: 15,
                grade: 'Dụng Thần Vô Dụng',
                reasons: [`Dụng Thần bị Nguyệt Xung Phá LẠI Nhập Mộ tại Nhật (Thuộc thế vô dụng hoàn toàn, loại bỏ 100%).`]
            };
        }

        // B. Kiểm tra Dụng Thần Động HÓA SUY BẠI (Hồi đầu khắc / Thoái / Tuyệt / Phá)
        if (dtLine.isMoving && isHoaSuyBai(dtLine, cal)) {
            return {
                isQualified: false,
                score: 15,
                grade: 'Dụng Thần Suy Bại',
                reasons: [`Dụng Thần (${targetRel}) động Hóa Suy Bại (Hồi đầu khắc / Hóa thoái / Hóa tuyệt / Hóa phá - loại bỏ 100%).`]
            };
        }

        if (!dtLine.isMoving && bestCand.isClashed) {
            return {
                isQualified: false,
                score: 15,
                grade: 'Dụng Thần Bị Xung Phá',
                reasons: [`Dụng Thần (${targetRel}) bị Nguyệt/Nhật xung phá (Khí lộc bị tổn hại nặng, không phù hợp).`]
            };
        }

        // C. Kiểm tra NGUYÊN THẦN (Cái sinh cho Dụng Thần) nếu là Hào Động
        hexData.linesData.forEach(dL => {
            if (dL.isMoving && (isGenerating(dL.hanh, dtLine.hanh) || (nguyenRelPrefix && dL.relation.startsWith(nguyenRelPrefix)))) {
                if (isHoaSuyBai(dL, cal)) {
                    reasons.push(`⚠️ Nguyên Thần (${dL.relation}) động Hóa Suy Bại (Không thể sinh trợ cho Dụng Thần).`);
                } else if (isMovingLineVoDung(dL, cal)) {
                    reasons.push(`⚠️ Nguyên Thần (${dL.relation}) bị Nguyệt Phá lại Nhập Nhật Mộ (Vô dụng hoàn toàn, không sinh trợ được Dụng Thần).`);
                } else {
                    dungThanIsVung = true;
                    dungThanScore += 25;
                    reasons.push(`🔥 Quẻ có Hào Động tương sinh Dụng Thần (${targetRel}) - Lực sinh trợ mạnh nhất (Đại Cát).`);
                }
            }
        });

        const vInfo = getLineVungScore(dtLine, cal, hexData);
        dungThanScore += vInfo.score;
        dungThanNote = vInfo.note;
        if (vInfo.isVung) dungThanIsVung = true;

        if (!dungThanIsVung) {
            return {
                isQualified: false,
                score: 20,
                grade: 'Dụng Thần Suy',
                reasons: [`Dụng Thần (${targetRel}) bị suy vi (Khí vận cầu công danh/tài lộc chưa đủ vượng).`]
            };
        }

        if (vInfo.isGiaKhong) {
            reasons.push(`Dụng Thần (${targetRel}) tuy gặp Không Vong nhưng được vượng khí tại Nguyệt Lệnh (Giả Không - Vẫn đắc lực cát tường).`);
        } else {
            reasons.push(`Dụng Thần (${targetRel}) vượng khí, trợ vận may phát triển tốt.`);
        }
    }

    totalScore += dungThanScore;

    // 3. ĐÁNH GIÁ KỊ THẦN (CÁI KHẮC DỤNG THẦN / NGUYÊN THẦN / HÀO THẾ)
    // Quy tắc: Kỵ thần nếu động HỮU DỤNG & VƯỢNG ➔ Khắc Dụng/Nguyên/Thế ➔ XẤU (Loại bỏ 100%)
    //          Kỵ thần nếu động HÓA SUY BẠI hoặc VÔ DỤNG ➔ Kỵ thần bị vô hiệu ➔ CÁT (Không loại bỏ).
    const activeKyLines = hexData.linesData.filter(dL => dL.isMoving && (
        isOvercoming(dL.hanh, dtCandHanh(bestCand)) ||
        isOvercoming(dL.hanh, theHanh) ||
        (kyRelPrefix && dL.relation.startsWith(kyRelPrefix))
    ));

    for (let kyL of activeKyLines) {
        if (isKyThanHuuDung(kyL, cal)) {
            return {
                isQualified: false,
                score: 10,
                grade: 'Kỵ Thần Vượng Khắc',
                reasons: [`Kỵ Thần (${kyL.relation} - ${kyL.chi}) động Hữu Dụng & Vượng tương khắc Dụng Thần / Hào Thế (Đại hung, loại bỏ 100%).`]
            };
        } else {
            reasons.push(`✨ Kỵ Thần (${kyL.relation} - ${kyL.chi}) động Hóa Suy Bại hoặc Vô Dụng (Kỵ Thần bị vô hiệu hóa, không thể gây hại - Cát tường).`);
        }
    }

    // 4. ĐÁNH GIÁ HÀO THẾ (BẢN MỆNH & ĐỘNG BIẾN QUYẾT ĐỊNH)
    // Riêng Hào Thế động: Chỉ có Hóa hồi đầu khắc, Hóa thoái thần, Hóa tuyệt mới tính là XẤU
    const theVungInfo = getLineVungScore(haoThe, cal, hexData);

    if (!haoThe.isMoving && (isBranchXung(theChi, nguyetChi) || isBranchXung(theChi, nhatChi))) {
        return {
            isQualified: false,
            score: 10,
            grade: 'Hào Thế Bị Xung Phá',
            reasons: [`Hào Thế (bản mệnh) bị xung khắc chấn động (Khí vận không an ổn, không gánh được tài lộc).`]
        };
    }

    if (!haoThe.isMoving && (theVungInfo.isChanKhong || theVungInfo.isChanMo)) {
        return {
            isQualified: false,
            score: 10,
            grade: 'Hào Thế Suy Hưu Tù',
            reasons: [`Hào Thế (bản mệnh) bị Chân Không hoặc Nhập Mộ Hưu Tù (Bản mệnh suy vi không tiếp nhận được vận lộc).`]
        };
    }

    const bịNhậtKhắc = isOvercoming(nhatHanh, theHanh);
    const bịNguyệtKhắc = isOvercoming(nguyetHanh, theHanh);

    if (bịNhậtKhắc || bịNguyệtKhắc) {
        return {
            isQualified: false,
            score: 10,
            grade: 'Hào Thế Bị Khắc',
            reasons: [`Hào Thế (bản mệnh) bị tương khắc (Khí vận không an ổn, không gánh được tài lộc).`]
        };
    }

    if (haoThe.isMoving) {
        const changedRelPrefix = haoThe.changed.relation.split(' ')[0];

        if (kyRelPrefix && changedRelPrefix === kyRelPrefix) {
            return {
                isQualified: false,
                score: 15,
                grade: 'Thế Hóa Kỵ Thần',
                reasons: [`Hào Thế động Hóa Kỵ Thần (Thuộc thế suy bại hoàn toàn, loại bỏ 100%).`]
            };
        }

        if (changedRelPrefix === 'Quan' && dtRelPrefix !== 'Quan' && kyRelPrefix !== 'Quan') {
            return {
                isQualified: false,
                score: 15,
                grade: 'Thế Hóa Quan Quỷ',
                reasons: [`Hào Thế động Hóa Quan Quỷ (Bản mệnh gặp suy vi, loại bỏ 100%).`]
            };
        }

        // Kiểm tra Hào Thế Hóa Suy Bại (Chỉ gồm Hóa Hồi Đầu Khắc, Hóa Thoái Thần, Hóa Tuyệt)
        if (isHaoTheHoaSuyBai(haoThe)) {
            return {
                isQualified: false,
                score: 15,
                grade: 'Thế Hóa Suy Bại',
                reasons: [`Hào Thế (bản mệnh) động Hóa Suy Bại (Hóa hồi đầu khắc / Hóa thoái thần / Hóa tuyệt - loại bỏ 100%).`]
            };
        }

        if (changedRelPrefix === dtRelPrefix) {
            totalScore += 25;
            reasons.push(`🌟 Hào Thế động Hóa Dụng Thần (${targetRel}) - Mẫu quẻ đại cát tường!`);
        } else if (changedRelPrefix === 'Tử' && dtRelPrefix !== 'Tử' && kyRelPrefix !== 'Tử') {
            totalScore += 20;
            reasons.push(`✨ Hào Thế động Hóa Tử Tôn (Bản mệnh đắc phúc đức, vượng cát).`);
        }
    }

    // 5. KIỂM TRA QUY TẮC HÀO ĐỘNG TẠI GIAN HÀO (HÀO NẰM GIỮA THẾ VÀ ỨNG)
    const shiLineIdx = hexData.linesData.findIndex(l => l.isShi);
    const yingLineIdx = hexData.linesData.findIndex(l => l.isYing);

    if (shiLineIdx !== -1 && yingLineIdx !== -1) {
        const minIdx = Math.min(shiLineIdx, yingLineIdx);
        const maxIdx = Math.max(shiLineIdx, yingLineIdx);

        for (let i = minIdx + 1; i < maxIdx; i++) {
            const gianLine = hexData.linesData[i];
            if (gianLine && gianLine.isMoving) {
                const dtChi = bestCand.chi;
                const dtHanh = dtCandHanh(bestCand);

                const interactsDungThan = (
                    isGenerating(gianLine.hanh, dtHanh) ||
                    isGenerating(dtHanh, gianLine.hanh) ||
                    isOvercoming(gianLine.hanh, dtHanh) ||
                    isOvercoming(dtHanh, gianLine.hanh) ||
                    isBranchXung(gianLine.chi, dtChi) ||
                    isBranchHarmonious(gianLine.chi, dtChi) ||
                    (gianLine.chi === dtChi)
                );

                const interactsNguyenKy = (
                    (nguyenThan && gianLine.relation.startsWith(nguyenThan.split(' ')[0])) ||
                    (kyThan && gianLine.relation.startsWith(kyThan.split(' ')[0])) ||
                    (nguyenThan && isBranchHarmonious(gianLine.chi, nguyenThan)) ||
                    (kyThan && isBranchHarmonious(gianLine.chi, kyThan))
                );

                const interactsHaoThe = (
                    isGenerating(gianLine.hanh, theHanh) ||
                    isGenerating(theHanh, gianLine.hanh) ||
                    isOvercoming(gianLine.hanh, theHanh) ||
                    isOvercoming(theHanh, gianLine.hanh) ||
                    isBranchXung(gianLine.chi, theChi) ||
                    isBranchHarmonious(gianLine.chi, theChi) ||
                    (gianLine.chi === theChi)
                );

                if (!interactsDungThan && !interactsNguyenKy && !interactsHaoThe) {
                    return {
                        isQualified: false,
                        score: 15,
                        grade: 'Gian Hào Động Gây Cản Trở (Hung)',
                        reasons: [`Hào động ở Gian Hào (Hào ${i + 1} nằm giữa Thế và Ứng) không tương tác với Dụng Thần, Nguyên/Kỵ Thần hay Hào Thế ➔ Biểu thị sự cản trở, trung gian nhiễu khí gây trắc trở (Hung, loại bỏ 100%).`]
                    };
                }
            }
        }
    }

    const isTheNhatSinh = (theHanh === nhatHanh || isGenerating(nhatHanh, theHanh));
    const isTheNguyetSinh = (theHanh === nguyetHanh || isGenerating(nguyetHanh, theHanh));
    const isTheLamNguyetHop = (theChi === nhatChi || theChi === nguyetChi || isBranchHarmonious(theChi, nguyetChi) || (!haoThe.isMoving && isBranchHarmonious(theChi, nhatChi)));
    const isTheHung = (theVungInfo.isVung || isTheNhatSinh || isTheNguyetSinh || isTheLamNguyetHop) && !(!haoThe.isMoving && (isBranchXung(theChi, nguyetChi) || isBranchXung(theChi, nhatChi))) && !theVungInfo.isChanKhong && !theVungInfo.isChanMo;

    if (targetRel === 'Thế') {
        if (!theVungInfo.isVung) {
            return {
                isQualified: false,
                score: 15,
                grade: 'Hào Thế Suy',
                reasons: [`Hào Thế (bản mệnh) bị suy vi (Sức khỏe & bản mệnh chưa đạt thế vượng).`]
            };
        }
    } else {
        if (!isTheHung) {
            return {
                isQualified: false,
                score: 15,
                grade: 'Hào Thế Suy',
                reasons: [`Hào Thế (bản mệnh) bị suy vi (Bản mệnh chưa vượng để gánh tài lộc).`]
            };
        }

        if (isTheNhatSinh && !theVungInfo.isVung) {
            reasons.push(`Hào Thế (bản mệnh) đạt thế HƯNG (Nhật Thần sinh phò, bản mệnh vững vàng).`);
        }
    }

    const dtChi = bestCand.chi;
    const dtHanh = dtCandHanh(bestCand);
    if (bestCand.isMoving && isOvercoming(dtHanh, theHanh)) {
        if (purpose === 'cautai') {
            const theNhatSinh = (theHanh === nhatHanh || isGenerating(nhatHanh, theHanh));
            const theNguyetSinh = (theHanh === nguyetHanh || isGenerating(nguyetHanh, theHanh));

            if (theNhatSinh && theNguyetSinh) {
                totalScore += 20;
                reasons.push(`Tài lộc chủ động tìm đến bản mệnh vượng (Mẫu quẻ Tài Lai Khắc Thế đại cát).`);
            } else {
                return {
                    isQualified: false,
                    score: 20,
                    grade: 'Tài Khắc Thế Suy',
                    reasons: ['Tài lộc khắc bản mệnh khi bản mệnh chưa đủ vượng (Không đón được lộc).']
                };
            }
        } else {
            return {
                isQualified: false,
                score: 15,
                grade: 'Dụng Thần Khắc Thế',
                reasons: [`Dụng Thần tương khắc Hào Thế (Gây áp lực lên bản mệnh).`]
            };
        }
    }

    const dtXungThe = isBranchXung(dtChi, theChi);
    const dtHopThe = isBranchHarmonious(dtChi, theChi);

    if (dtXungThe || dtHopThe) {
        if (!isTheHung) {
            return {
                isQualified: false,
                score: 15,
                grade: 'Thế Suy',
                reasons: [`Hào Thế bị suy vi, chưa tiếp nhận được vận may của Dụng Thần.`]
            };
        } else {
            totalScore += 25;
            reasons.push(`🔥 Dụng Thần tương hợp Hào Thế vượng (Vận lộc gắn liền với bản mệnh, đại cát đại lợi).`);
        }
    }

    totalScore += theVungInfo.score || 20;

    if (haoThe.isMoving) {
        const hoiDauSinhDung = isGenerating(haoThe.changed.hanh, theHanh);
        const hoaTien = isProgressingBranch(theChi, haoThe.changed.branch);

        if (hoiDauSinhDung) {
            totalScore += 30;
            reasons.push(`🌟 Hào Thế động hóa Dụng Thần hồi đầu sinh (Mẫu quẻ hanh thông, đại cát tường).`);
        } else if (hoaTien) {
            totalScore += 25;
            reasons.push(`✨ Hào Thế động Hóa Tiến Thần (Vận trình bản thân ngày càng thăng tiến).`);
        } else {
            reasons.push(`Hào Thế (bản mệnh) động sinh trợ vượng khí.`);
        }
    }

    const mainName = hexData.mainName;
    if (mainName.includes('Thái') || mainName.includes('Trung Phu') || mainName.includes('Đại Hữu') || mainName.includes('Gia Nhân') || mainName.includes('Ích') || mainName.includes('Tụy')) {
        totalScore += 10;
        reasons.push(`Quẻ Chủ ${mainName} thuộc nhóm quẻ Đại Cát Tường.`);
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

function dtCandHanh(cand) {
    if (!cand) return 'Thổ';
    return cand.hanh || 'Thổ';
}

function generateMatchingSims(pattern, dateInput, gender, purpose, maxCount = 15) {
    const cal = calculateCanChi(dateInput);
    if (!cal) return [];

    let fixedPattern = pattern.replace(/[^0-9*]/g, '');
    while (fixedPattern.length < 10) fixedPattern += '*';
    fixedPattern = fixedPattern.slice(0, 10);

    const activePrefixes = [
        '098', '097', '096', '086', '039', '038', '037', '036', '035', '034', '033', '032',
        '090', '093', '089', '070', '079', '077', '076', '078',
        '091', '094', '088', '083', '084', '085', '081', '082',
        '087', '099', '056', '058'
    ];

    const results = [];
    const testedSims = new Set();
    const targetQualifiedCount = Math.max(maxCount, 15);
    const maxAttempts = 30000;
    let attempts = 0;

    while (results.length < targetQualifiedCount && attempts < maxAttempts) {
        attempts++;

        let candidate = '';
        const needPrefixChoice = (fixedPattern[1] === '*' || fixedPattern[2] === '*');

        if (needPrefixChoice && Math.random() < 0.85) {
            const randomPrefix = activePrefixes[Math.floor(Math.random() * activePrefixes.length)];
            candidate = randomPrefix;
            for (let i = 3; i < 10; i++) {
                if (fixedPattern[i] !== '*') {
                    candidate += fixedPattern[i];
                } else {
                    candidate += Math.floor(Math.random() * 10).toString();
                }
            }
        } else {
            for (let i = 0; i < 10; i++) {
                if (fixedPattern[i] !== '*') {
                    candidate += fixedPattern[i];
                } else {
                    candidate += Math.floor(Math.random() * 10).toString();
                }
            }
        }

        if (candidate.length !== 10 || testedSims.has(candidate)) continue;
        testedSims.add(candidate);

        const hexData = calculateSimHexagram(candidate, cal);
        if (!hexData) continue;

        const evalResult = evaluateSimFengShui(candidate, hexData, cal, purpose, gender);

        if (evalResult.isQualified) {
            results.push({
                sim: candidate,
                hexData,
                evaluation: evalResult
            });
        }
    }

    results.sort((a, b) => b.evaluation.score - a.evaluation.score);
    return results.slice(0, maxCount);
}
