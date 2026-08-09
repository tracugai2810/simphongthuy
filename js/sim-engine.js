/* ==========================================================================
   SIM PHONG THỦY ENGINE & EVALUATOR - CHUẨN ĐÃI LỌC DỊCH HỌC LỤC HÀO PRO
   ==========================================================================
   TRÌNH TỰ ĐÃI LỌC BẮT BUỘC:
   1. XÉT HÀO THẾ ĐẦU TIÊN (Hào Thế vượng mới xét đến Dụng Thần):
      - Hào Thế SUY ➔ BỎ LUÔN (Loại bỏ 100%).
   2. HÀO THẾ VƯỢNG ➔ XÉT TIẾP ĐẾN DỤNG THẦN:
      - Dụng Thần SUY ➔ CŨNG BỎ (Loại bỏ 100%).
   3. HÀO THẾ VƯỢNG + DỤNG THẦN VƯỢNG ➔ MỚI TÍNH CÁT (Thế Vượng Dụng Vượng đại cát tường).
   ========================================================================== */

const ELEMENTS = ['Kim', 'Thủy', 'Mộc', 'Hỏa', 'Thổ'];

// Ngũ hành Địa Chi
const NGU_HANH_CHI_ENGINE = {
    'Hợi': 'Thủy', 'Tý': 'Thủy',
    'Dần': 'Mộc', 'Mão': 'Mộc',
    'Tỵ': 'Hỏa', 'Ngọ': 'Hỏa',
    'Thân': 'Kim', 'Dậu': 'Kim',
    'Thìn': 'Thổ', 'Tuất': 'Thổ', 'Sửu': 'Thổ', 'Mùi': 'Thổ'
};

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

// Kiểm tra Lục Hợp nhưng Hợp Tàng Khắc (Mão-Tuất, Tỵ-Thân, Tý-Sửu)
function isHopTangKhac(b1, b2) {
    if (!isBranchHarmonious(b1, b2)) return false;
    const h1 = NGU_HANH_CHI_ENGINE[b1];
    const h2 = NGU_HANH_CHI_ENGINE[b2];
    return isOvercoming(h1, h2) || isOvercoming(h2, h1);
}

// Tiến thần
function isProgressingBranch(bMain, bChanged) {
    const prog = {
        'Dần': 'Mão', 'Tỵ': 'Ngọ', 'Thân': 'Dậu', 'Hợi': 'Tý',
        'Sửu': 'Thìn', 'Thìn': 'Mùi', 'Mùi': 'Tuất', 'Tuất': 'Sửu'
    };
    return prog[bMain] === bChanged;
}

// Thoái thần
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
   1. HÀM KIỂM TRA HÀO ĐỘNG SUY BẠI (DỤNG THẦN, NGUYÊN THẦN, HÀO THẾ)
   ========================================================================== */
function isDongLineSuyBai(line, cal, hexData = null) {
    if (!line || !line.isMoving) return false;

    const chiMain = line.chi || line.branch;
    const hanhMain = line.hanh;
    const chiChanged = line.changed ? line.changed.branch : '';
    const hanhChanged = line.changed ? line.changed.hanh : '';

    // 1. Hóa Hồi Đầu Khắc
    if (line.changed && isOvercoming(hanhChanged, hanhMain)) return true;
    // 2. Hóa Thoái Thần
    if (line.changed && isRegressingBranch(chiMain, chiChanged)) return true;
    // 3. Hóa Tuyệt (12 Vòng Trường Sinh)
    if (line.changed && getLifeStage(hanhMain, chiChanged) === 'Tuyệt') return true;
    // 4. Hóa Mộ
    if (line.changed && chiChanged === getTombBranch(hanhMain)) return true;
    // 5. Hóa Hào Biến Bị Nhật Nguyệt Xung (Hóa Phá)
    if (line.changed && (isBranchXung(chiChanged, cal.thang.chi) || isBranchXung(chiChanged, cal.ngay.chi))) return true;
    // 6. Hào Động Bị Nhật Nguyệt Xung
    if (isBranchXung(chiMain, cal.thang.chi) || isBranchXung(chiMain, cal.ngay.chi)) return true;
    // 7. Hóa Không Vong
    if (line.changed && cal.tuanKhong.includes(chiChanged)) return true;
    // 8. Hào Động Không Vong
    if (cal.tuanKhong.includes(chiMain)) return true;
    // 9. Hóa Hợp Với Nhật/Nguyệt
    if (line.changed && (isBranchHarmonious(chiChanged, cal.thang.chi) || isBranchHarmonious(chiChanged, cal.ngay.chi))) return true;
    // 10. Hóa Hợp Với Hào Động Khác Trong Quẻ
    if (line.changed && hexData && hexData.linesData) {
        const isHoaHopOtherDong = hexData.linesData.some(otherL => otherL !== line && otherL.isMoving && isBranchHarmonious(chiChanged, otherL.chi));
        if (isHoaHopOtherDong) return true;
    }
    // 11. Mộ Tại Nhật Thần
    if (cal.ngay.chi === getTombBranch(hanhMain)) return true;
    // 12. Bị Nguyệt Hợp Mà Hợp Tàng Khắc (Ví dụ Nguyệt Mão hợp Hào Tuất)
    if (isHopTangKhac(cal.thang.chi, chiMain)) return true;

    return false;
}

/* ==========================================================================
   2. HÀM KIỂM TRA HÀO TĨNH SUY BẠI (DỤNG THẦN TĨNH)
   ========================================================================== */
function isTinhDungThanSuyBai(line, cal, hexData) {
    if (!line || line.isMoving) return false;

    const chi = line.chi || line.branch;
    const hanh = line.hanh;
    const nhatChi = cal.ngay.chi;
    const nhatHanh = cal.ngay.hanh;
    const nguyetChi = cal.thang.chi;
    const nguyetHanh = cal.thang.hanh;

    // 1. Không được Nguyệt sinh phò (lúc này Nhật sinh không có tác dụng trừ khi Nhật Hợp)
    const isNguyetSinhPho = (hanh === nguyetHanh || isGenerating(nguyetHanh, hanh));
    const isNhatSinh = (hanh === nhatHanh || isGenerating(nhatHanh, hanh));
    const isNhatHop = isBranchHarmonious(chi, nhatChi);

    if (!isNguyetSinhPho) {
        if (!(isNhatSinh && isNhatHop)) {
            return true; // Suy Bại!
        }
    }

    // 2. Nhập Mộ tại Nhật
    if (nhatChi === getTombBranch(hanh)) return true;
    // 3. Nhập Mộ tại Hào Động
    if (hexData && hexData.linesData) {
        const isMoTaiHaoDong = hexData.linesData.some(dL => dL.isMoving && dL.chi === getTombBranch(hanh));
        if (isMoTaiHaoDong) return true;
    }
    // 4. Dụng Thần Không Vong
    if (cal.tuanKhong.includes(chi)) return true;
    // 5. Dụng Thần bị Hào Động khắc
    if (hexData && hexData.linesData) {
        const isBiDongKhac = hexData.linesData.some(dL => dL.isMoving && isOvercoming(dL.hanh, hanh));
        if (isBiDongKhac) return true;
    }
    // 6. Dụng Thần bị Hào Động xung hoặc hợp
    if (hexData && hexData.linesData) {
        const isBiDongXungHop = hexData.linesData.some(dL => dL.isMoving && (isBranchXung(dL.chi, chi) || isBranchHarmonious(dL.chi, chi)));
        if (isBiDongXungHop) return true;
    }
    // 7. Bị Nhật Hợp hoặc Nguyệt Hợp mà Hợp Tàng Khắc
    if (isHopTangKhac(nguyetChi, chi) || isHopTangKhac(nhatChi, chi)) return true;

    return false;
}

/* ==========================================================================
   3. HÀM KIỂM TRA HÀO THẾ SUY BẠI (KHI DỤNG THẦN ĐÃ VƯỢNG & THẾ KHÔNG PHẢI DỤNG THẦN)
   ========================================================================== */
function isHaoTheSuyBaiWhenDungVung(haoThe, cal, hexData, bestCand) {
    const theChi = haoThe.chi;
    const theHanh = haoThe.hanh;
    const nhatChi = cal.ngay.chi;
    const nhatHanh = cal.ngay.hanh;
    const nguyetChi = cal.thang.chi;
    const nguyetHanh = cal.thang.hanh;

    // 1. Không được Nhật Nguyệt sinh cho (Cả Nhật và Nguyệt đều không sinh)
    const isNhatSinh = (theHanh === nhatHanh || isGenerating(nhatHanh, theHanh));
    const isNguyetSinh = (theHanh === nguyetHanh || isGenerating(nguyetHanh, theHanh));
    if (!isNhatSinh && !isNguyetSinh) return true;

    // 2. Hào Thế Không Vong
    if (cal.tuanKhong.includes(theChi)) return true;

    // 3. Hào Thế Nhập Mộ tại Nhật
    if (nhatChi === getTombBranch(theHanh)) return true;

    // Lấy danh sách Hào Động KHÔNG tương tác với Dụng Thần
    const dtChi = bestCand ? bestCand.chi : '';
    const dtHanh = bestCand ? (bestCand.hanh || 'Thổ') : 'Thổ';

    const nonDungDongLines = (hexData && hexData.linesData) ? hexData.linesData.filter(dL => {
        if (!dL.isMoving) return false;
        const interactsDung = (
            isGenerating(dL.hanh, dtHanh) ||
            isGenerating(dtHanh, dL.hanh) ||
            isOvercoming(dL.hanh, dtHanh) ||
            isOvercoming(dtHanh, dL.hanh) ||
            isBranchXung(dL.chi, dtChi) ||
            isBranchHarmonious(dL.chi, dtChi) ||
            (dL.chi === dtChi)
        );
        return !interactsDung;
    }) : [];

    // 4. Hào Thế bị Hào Động khắc (khi Hào Động không tương tác với Dụng Thần mới tương tác với Thế)
    const isBiDongNonDungKhac = nonDungDongLines.some(dL => isOvercoming(dL.hanh, theHanh));
    if (isBiDongNonDungKhac) return true;

    // 5. Hào Thế Nhập Mộ tại Hào Động (khi Hào Động không tương tác với Dụng Thần mới tương tác với Thế)
    const isMoTaiNonDungDong = nonDungDongLines.some(dL => dL.chi === getTombBranch(theHanh));
    if (isMoTaiNonDungDong) return true;

    // 6. Bị Nhật xung, Nguyệt xung
    if (isBranchXung(theChi, nhatChi) || isBranchXung(theChi, nguyetChi)) return true;

    // 7. Bị Nhật Hợp hoặc Nguyệt Hợp mà Hợp Tàng Khắc
    if (isHopTangKhac(nguyetChi, theChi) || isHopTangKhac(nhatChi, theChi)) return true;

    return false;
}

/* ==========================================================================
   4. HÀM TÍNH MỨC ĐỘ VƯỢNG SUY CỦA HÀO
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

    if (line.isMoving) {
        if (isDongLineSuyBai(line, cal, hexData)) {
            return { score: 0, isVung: false, isSuyBai: true, note: 'Hào động Suy Bại' };
        }
        return { score: 40, isVung: true, note: 'Hào động không hóa suy bại (Hữu dụng vượng khí)' };
    } else {
        const isStaticVung = (isLamNhatNguyet || isNguyetHop || isNhatHop || isNguyetSinhPho);

        if (isBranchXung(chi, nguyetChi)) {
            return { score: 0, isVung: false, isXungPha: true, note: 'Bị Nguyệt Xung (Nguyệt Phá - Xấu)' };
        }
        if (isBranchXung(chi, nhatChi)) {
            return { score: 0, isVung: false, isXungPha: true, note: 'Bị Nhật Xung (Ám Xung - Suy)' };
        }

        if (nhatChi === getTombBranch(hanh)) {
            return { score: 0, isVung: false, isChanMo: true, note: 'Tĩnh Nhập Mộ tại Nhật (Suy Bại)' };
        }

        if (cal.tuanKhong.includes(chi)) {
            if (isStaticVung) {
                return { score: 30, isVung: true, isGiaKhong: true, note: 'Tĩnh Không Vong nhưng Vượng (Giả Không)' };
            } else {
                return { score: 0, isVung: false, isChanKhong: true, note: 'Tĩnh Không Vong bị Hưu Tù (Chân Không)' };
            }
        }

        if (isLamNhatNguyet || isNguyetHop || isNhatHop) {
            return { score: 40, isVung: true, note: 'Được Nhật Nguyệt sinh trợ vượng khí' };
        }
        if (isNguyetSinhPho) return { score: 30, isVung: true, note: 'Nguyệt Lệnh sinh phò vượng khí' };
        if (isNhatSinhPho) return { score: 20, isVung: false, note: 'Nhật Thần sinh phò' };
        return { score: 0, isVung: false, note: 'Bị suy vi' };
    }
}

/* ==========================================================================
   5. HÀM TÌM DỤNG THẦN TỐI ƯU THEO THỨ TỰ UYÊN THÂM 5 BẬC
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
   6. HÀM ĐÁNH GIÁ PHONG THỦY LỤC HÀO SIM TỔNG THỂ
   TRÌNH TỰ ĐÃI LỌC CHUẨN:
   - XÉT HÀO THẾ ĐẦU TIÊN ➔ HÀO THẾ VƯỢNG MỚI XÉT ĐẾN DỤNG THẦN!
   - HÀO THẾ SUY ➔ BỎ LUÔN (Loại bỏ 100%).
   - HÀO THẾ VƯỢNG + DỤNG THẦN SUY ➔ CŨNG BỎ (Loại bỏ 100%).
   - HÀO THẾ VƯỢNG + DỤNG THẦN VƯỢNG ➔ MỚI TÍNH CÁT!
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

    // =========================================================================
    // BƯỚC 1: XÉT HÀO THẾ ĐẦU TIÊN (HÀO THẾ VƯỢNG MỚI XÉT ĐẾN DỤNG THẦN!)
    // HÀO THẾ SUY ➔ BỎ LUÔN!
    // =========================================================================
    const isTheIsDungThan = (targetRel === 'Thế' || (hexData.linesData.findIndex(l => l === haoThe) === hexData.linesData.findIndex(l => l.relation.startsWith(dtRelPrefix))));

    if (isTheIsDungThan) {
        if (haoThe.isMoving) {
            if (isDongLineSuyBai(haoThe, cal, hexData)) {
                return {
                    isQualified: false,
                    score: 15,
                    grade: 'Thế Suy Bại',
                    reasons: [`Hào Thế (Bản mệnh & Dụng Thần) động Hóa Suy Bại ➔ Bỏ luôn (Loại bỏ 100%).`]
                };
            }
            reasons.push(`🔮 Hào Thế (Bản mệnh & Dụng Thần) động hữu dụng vượng khí Cát tường.`);
        } else {
            if (isTinhDungThanSuyBai(haoThe, cal, hexData)) {
                return {
                    isQualified: false,
                    score: 15,
                    grade: 'Thế Suy Bại',
                    reasons: [`Hào Thế (Bản mệnh & Dụng Thần) tĩnh bị Suy Bại ➔ Bỏ luôn (Loại bỏ 100%).`]
                };
            }
            reasons.push(`Hào Thế (Bản mệnh & Dụng Thần) tĩnh vượng khí Cát tường.`);
        }
    } else {
        // KHI HÀO THẾ KHÔNG PHẢI LÀ DỤNG THẦN
        if (haoThe.isMoving) {
            if (isDongLineSuyBai(haoThe, cal, hexData)) {
                return {
                    isQualified: false,
                    score: 15,
                    grade: 'Hào Thế Động Suy Bại',
                    reasons: [`Hào Thế (Bản mệnh) động Hóa Suy Bại ➔ Bỏ luôn (Loại bỏ 100%).`]
                };
            }
        } else {
            if (isHaoTheSuyBaiWhenDungVung(haoThe, cal, hexData, null)) {
                return {
                    isQualified: false,
                    score: 15,
                    grade: 'Hào Thế Suy Bại',
                    reasons: [`Hào Thế (Bản mệnh) bị Suy Bại ➔ Bỏ luôn (Bản mệnh chưa vượng để gánh tài lộc, loại bỏ 100%).`]
                };
            }
        }

        const isNhatSinhThe = (theHanh === nhatHanh || isGenerating(nhatHanh, theHanh));
        const isNguyetSinhThe = (theHanh === nguyetHanh || isGenerating(nguyetHanh, theHanh));
        const isDongSinhThe = hexData.linesData.some(dL => dL.isMoving && isGenerating(dL.hanh, theHanh) && !isDongLineSuyBai(dL, cal, hexData));

        if (isNhatSinhThe || isNguyetSinhThe || isDongSinhThe) {
            reasons.push(`🌟 Hào Thế (Bản mệnh) VƯỢNG KHÍ (Được Nhật/Nguyệt/Hào động sinh trợ - Đủ thế vượng để tiếp nhận Dụng Thần).`);
        } else {
            reasons.push(`Hào Thế (Bản mệnh) tránh được các trường hợp suy bại (Đạt thế vượng khí).`);
        }
    }

    // NẾU HÀO THẾ SUY ➔ BỎ LUÔN (Đã return ở trên)

    // =========================================================================
    // BƯỚC 2: HÀO THẾ VƯỢNG RỒI ➔ XÉT TIẾP ĐẾN DỤNG THẦN!
    // DỤNG THẦN SUY ➔ CŨNG BỎ!
    // =========================================================================
    let bestCand = findBestDungThanCandidate(hexData, cal, targetRel);

    if (!bestCand) {
        return {
            isQualified: false,
            score: 15,
            grade: 'Khuyết Dụng Thần',
            reasons: [`Hào Thế đã vượng nhưng Dụng Thần (${targetRel}) không xuất hiện trong quẻ ➔ Cũng bỏ (Loại bỏ 100%).`]
        };
    }

    let dungThanIsVung = false;
    let dungThanScore = 0;

    if (bestCand.source === 'phucThan') {
        const pt = bestCand.phucThan;
        const phi = bestCand.phiThan;

        const ptIsNguyetPha = isBranchXung(pt.branch, nguyetChi);
        const ptIsNhatPha = isBranchXung(pt.branch, nhatChi);
        if (bestCand.isTK || ptIsNguyetPha || ptIsNhatPha) {
            return {
                isQualified: false,
                score: 15,
                grade: 'Dụng Thần Suy Bại',
                reasons: [`Hào Thế đã vượng nhưng Dụng Thần Phục Thần bị Không Vong / Nguyệt Phá / Nhật Phá ➔ Cũng bỏ (Loại bỏ 100%).`]
            };
        }

        const phiVung = getLineVungScore(phi, cal, hexData);
        const phiSinhPt = isGenerating(phi.hanh, pt.hanh);

        if (phiSinhPt && phiVung.isVung) {
            dungThanIsVung = true;
            dungThanScore = 40;
            reasons.push(`Dụng Thần Phục Thần (${pt.branch}) vượng khí được Phi Thần sinh trợ.`);
        } else {
            return {
                isQualified: false,
                score: 15,
                grade: 'Dụng Thần Suy Bại',
                reasons: [`Hào Thế đã vượng nhưng Dụng Thần Phục Thần bị suy vi hoặc Phi Thần khắc phá ➔ Cũng bỏ (Loại bỏ 100%).`]
            };
        }
    } else if (bestCand.source === 'changed') {
        const parentL = bestCand.parentLine;

        if (isDongLineSuyBai(parentL, cal, hexData)) {
            return {
                isQualified: false,
                score: 15,
                grade: 'Dụng Thần Suy Bại',
                reasons: [`Hào Thế đã vượng nhưng Dụng Thần ở Hào Biến bị Hào Động sinh ra nó Suy Bại ➔ Cũng bỏ (Loại bỏ 100%).`]
            };
        }

        dungThanIsVung = true;
        dungThanScore = 40;
        reasons.push(`Dụng Thần ở Hào Biến (${bestCand.chi}) vượng khí Cát tường.`);
    } else {
        const dtLine = bestCand.line;

        // KHI DỤNG THẦN LÀ HÀO ĐỘNG
        if (dtLine.isMoving) {
            if (isDongLineSuyBai(dtLine, cal, hexData)) {
                return {
                    isQualified: false,
                    score: 15,
                    grade: 'Dụng Thần Động Suy Bại',
                    reasons: [`Hào Thế đã vượng nhưng Dụng Thần (${targetRel}) động Hóa Suy Bại ➔ Cũng bỏ (Loại bỏ 100%).`]
                };
            }
            dungThanIsVung = true;
            dungThanScore = 45;
            reasons.push(`🔮 Dụng Thần (${targetRel}) là Hào Động hữu dụng vượng khí (Đại Cát Tường).`);
        } else {
            // KHI DỤNG THẦN LÀ HÀO TĨNH
            if (isTinhDungThanSuyBai(dtLine, cal, hexData)) {
                return {
                    isQualified: false,
                    score: 15,
                    grade: 'Dụng Thần Tĩnh Suy Bại',
                    reasons: [`Hào Thế đã vượng nhưng Dụng Thần (${targetRel}) tĩnh bị Suy Bại ➔ Cũng bỏ (Loại bỏ 100%).`]
                };
            }
            dungThanIsVung = true;
            dungThanScore = 35;
            reasons.push(`Dụng Thần (${targetRel}) là Hào Tĩnh vượng khí Cát tường.`);
        }

        // KIỂM TRA NGUYÊN THẦN (SINH DỤNG THẦN)
        hexData.linesData.forEach(dL => {
            if (dL.isMoving && (isGenerating(dL.hanh, dtLine.hanh) || (nguyenRelPrefix && dL.relation.startsWith(nguyenRelPrefix)))) {
                if (isDongLineSuyBai(dL, cal, hexData)) {
                    reasons.push(`⚠️ Nguyên Thần (${dL.relation} - ${dL.chi}) động Hóa Suy Bại (Không sinh trợ được Dụng Thần).`);
                } else {
                    dungThanScore += 25;
                    reasons.push(`🔥 Quẻ có Hào Động Nguyên Thần sinh Dụng Thần (${targetRel}) - Lực sinh trợ mạnh nhất (Đại Cát).`);
                }
            }
        });
    }

    totalScore += dungThanScore;

    // =========================================================================
    // BƯỚC 3: KIỂM TRA KỊ THẦN (CÁI KHẮC DỤNG THẦN / NGUYÊN THẦN / HÀO THẾ)
    // =========================================================================
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
                reasons: [`Kỵ Thần (${kyL.relation} - ${kyL.chi}) động Hữu Dụng & Vượng tương khắc Dụng Thần / Hào Thế ➔ Bỏ luôn (Loại bỏ 100%).`]
            };
        } else {
            reasons.push(`✨ Kỵ Thần (${kyL.relation} - ${kyL.chi}) động Hóa Suy Bại / Vô Dụng (Mất khả năng gây hại - Cát tường).`);
        }
    }

    // =========================================================================
    // BƯỚC 4: KIỂM TRA HÀO ĐỘNG GIAN HÀO CẢN TRỞ (HUNG)
    // =========================================================================
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
                        reasons: [`Hào động ở Gian Hào (Hào ${i + 1} nằm giữa Thế và Ứng) không tương tác với Dụng Thần, Nguyên/Kỵ Thần hay Hào Thế ➔ Trung gian nhiễu khí cản trở (Loại bỏ 100%).`]
                    };
                }
            }
        }
    }

    // =========================================================================
    // BƯỚC 5: HÀO THẾ VƯỢNG + DỤNG THẦN VƯỢNG ➔ MỚI TÍNH CÁT!
    // =========================================================================
    totalScore += 25; // Điểm thưởng cơ bản cho quẻ Thế Vượng & Dụng Vượng

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
        isQualified: true, // HÀO THẾ VƯỢNG + DỤNG THẦN VƯỢNG ➔ MỚI TÍNH CÁT!
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
    const maxAttempts = 35000;
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
