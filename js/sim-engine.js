/* ==========================================================================
   SIM PHONG THỦY ENGINE & EVALUATOR - CHUẨN ĐÃI LỌC DỊCH HỌC LỤC HÀO PRO
   Lồng ghép 100% thuật toán Dịch Học từ file KIEN_THUC_LUC_HAO_SIM.md:
   1. Dụng thần động Hóa Thoái, Hóa Hồi Đầu Khắc, Hóa Tuyệt, Hóa Phá -> Bỏ 100%
   2. Dụng thần khắc Thế -> Bỏ 100% (Trừ Tài Lai Khắc Thế với Hào Thế Song Vượng)
   3. Dụng thần Xung/Hợp Hào Thế: Nếu Hào Thế Suy -> Bỏ 100%; Nếu Hào Thế Vượng -> Cát Tường tương đương Sinh Thế
   4. Hào Thế bị suy, bị khắc -> ĐỀU BỎ HẾT (Cho dù Dụng Thần Vượng)
   ========================================================================== */

const ELEMENTS = ['Kim', 'Thủy', 'Mộc', 'Hỏa', 'Thổ'];

// Element A generates Element B? (Kim -> Thủy -> Mộc -> Hỏa -> Thổ -> Kim)
function isGenerating(elA, elB) {
    const idxA = ELEMENTS.indexOf(elA);
    const idxB = ELEMENTS.indexOf(elB);
    return (idxA + 1) % 5 === idxB;
}

// Element A overcomes Element B? (Kim khắc Mộc, Mộc khắc Thổ, Thổ khắc Thủy, Thủy khắc Hỏa, Hỏa khắc Kim)
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

// Kiểm tra 6 cặp Lục Xung Địa Chi
function isBranchXung(b1, b2) {
    const pairs = [
        ['Tý', 'Ngọ'], ['Sửu', 'Mùi'], ['Dần', 'Thân'],
        ['Mão', 'Dậu'], ['Thìn', 'Tuất'], ['Tỵ', 'Hợi']
    ];
    return pairs.some(([a, b]) => (a === b1 && b === b2) || (a === b2 && b === b1));
}

// Hóa Tiến Thần (Dần->Mão, Tỵ->Ngọ, Thân->Dậu, Hợi->Tý, Sửu->Thìn...)
function isProgressingBranch(bMain, bChanged) {
    const prog = {
        'Dần': 'Mão', 'Tỵ': 'Ngọ', 'Thân': 'Dậu', 'Hợi': 'Tý',
        'Sửu': 'Thìn', 'Thìn': 'Mùi', 'Mùi': 'Tuất', 'Tuất': 'Sửu'
    };
    return prog[bMain] === bChanged;
}

// Hóa Thoái Thần (Mão->Dần, Ngọ->Tỵ, Dậu->Thân, Tý->Hợi...)
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

// Xác định Lục Thân Nguyên Thần (Sinh Dụng Thần) & Kỵ Thần (Khắc Dụng Thần)
function getNguyenAndKyThan(targetRel) {
    const rels = ['Huynh Đệ', 'Tử Tôn', 'Thê Tài', 'Quan Quỷ', 'Phụ Mẫu'];
    const idx = rels.findIndex(r => r.startsWith(targetRel.split(' ')[0]));
    if (idx === -1) return { nguyenThan: '', kyThan: '' };

    const nguyenIdx = (idx - 1 + 5) % 5; // Sinh Dụng thần
    const kyIdx = (idx + 1) % 5;        // Khắc Dụng thần

    return {
        nguyenThan: rels[nguyenIdx],
        kyThan: rels[kyIdx]
    };
}

/* ==========================================================================
   MỤC 1 KIẾN THỨC: HÀM TÍNH ĐIỂM MỨC ĐỘ VƯỢNG SUY CỦA HÀO (Hào Tĩnh & Hào Động)
   ========================================================================== */
function getLineVungScore(line, cal) {
    const chi = line.chi;
    const hanh = line.hanh;
    const nhatChi = cal.ngay.chi;
    const nhatHanh = cal.ngay.hanh;
    const nguyetChi = cal.thang.chi;
    const nguyetHanh = cal.thang.hanh;

    const isLamNhatNguyet = (chi === nhatChi || chi === nguyetChi);
    const isNguyetHop = isBranchHarmonious(chi, nguyetChi);
    const isNhatHop = !line.isMoving && isBranchHarmonious(chi, nhatChi); // Nhật hợp CHỈ TÍNH cho Hào Tĩnh
    const isNguyetSinhPho = (hanh === nguyetHanh || isGenerating(nguyetHanh, hanh));
    const isNhatSinhPho = (hanh === nhatHanh || isGenerating(nhatHanh, hanh));

    if (line.isMoving) {
        // Đối với Hào Động: Hóa Tiến Thần hoặc Hóa Hồi Đầu Sinh -> TỐT NHẤT (Hơn cả Lâm Nhật/Nguyệt/Hợp)
        const hoiDauSinh = isGenerating(line.changed.hanh, hanh);
        const hoaTien = isProgressingBranch(chi, line.changed.branch);

        if (hoiDauSinh || hoaTien) {
            let baseScore = 50;
            if (isLamNhatNguyet || isNguyetHop) baseScore += 20;
            else if (isNguyetSinhPho) baseScore += 15;
            else if (isNhatSinhPho) baseScore += 10;
            return {
                score: baseScore,
                isVung: true,
                note: `Động ${hoaTien ? 'Hóa Tiến Thần' : 'Hóa Hồi Đầu Sinh'} (Tốt hơn Lâm Nhật Nguyệt/Hợp)`
            };
        } else {
            if (isLamNhatNguyet || isNguyetHop) return { score: 35, isVung: true, note: 'Lâm/Nguyệt Hợp Nhật Nguyệt' };
            if (isNguyetSinhPho) return { score: 28, isVung: true, note: 'Nguyệt Lệnh vượng sinh/phò' };
            if (isNhatSinhPho) return { score: 20, isVung: true, note: 'Nhật Thần vượng sinh/phò' };
            return { score: 10, isVung: false, note: 'Động thường' };
        }
    } else {
        // Đối với Hào TĨNH
        if (isLamNhatNguyet || isNguyetHop || isNhatHop) {
            let note = isLamNhatNguyet ? 'Lâm Nhật/Nguyệt' : isNguyetHop ? 'Nguyệt Hợp' : 'Nhật Hợp';
            return { score: 40, isVung: true, note: `${note} (Cấp 1 - Vượng Nhất)` };
        }
        if (isNguyetSinhPho) return { score: 30, isVung: true, note: 'Nguyệt Lệnh vượng sinh/phò (Cấp 2 - Nguyệt Sinh > Nhật Sinh)' };
        if (isNhatSinhPho) return { score: 20, isVung: true, note: 'Nhật Thần vượng sinh/phò (Cấp 3)' };
        return { score: 0, isVung: false, note: 'Suy Tĩnh' };
    }
}

/* ==========================================================================
   HÀM ĐÁNH GIÁ PHONG THỦY SIM (LỒNG 100% KIẾN THỨC CỦA BẠN VÀO ENGINE)
   ========================================================================== */
function evaluateSimFengShui(simStr, hexData, cal, purpose, gender) {
    if (!hexData) return { isQualified: false, score: 0, grade: 'Không hợp lệ', reasons: ['Không thể lập quẻ.'] };

    const reasons = [];
    let totalScore = 40;

    const nhatHanh = cal.ngay.hanh;
    const nguyetHanh = cal.thang.hanh;

    // --- 1. XÁC ĐỊNH HÀO THẾ & DỤNG THẦN ---
    const haoThe = hexData.linesData.find(l => l.isShi);
    if (!haoThe) {
        return { isQualified: false, score: 0, grade: 'Khắc', reasons: ['Không tìm thấy Hào Thế.'] };
    }

    const theHanh = haoThe.hanh;
    const theChi = haoThe.chi;

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
            score: 15,
            grade: 'Khuyết Dụng Thần',
            reasons: [`Dụng Thần ${targetRel} không xuất hiện trong quẻ (Khuyết Dụng Thần - Bỏ).`]
        };
    }

    // --- 2. QUY TẮC: DỤNG THẦN ĐỘNG HÓA BẠI (THOÁI, HỒI ĐẦU KHẮC, TUYỆT, PHÁ) ➔ BỎ 100% ---
    for (let dt of dungThanLines) {
        if (dt.isMoving) {
            const dtHoiDauSinh = isGenerating(dt.changed.hanh, dt.hanh);
            const dtHoiDauKhac = isOvercoming(dt.changed.hanh, dt.hanh);
            const dtHoaTien = isProgressingBranch(dt.chi, dt.changed.branch);
            const dtHoaThoai = isRegressingBranch(dt.chi, dt.changed.branch);
            const dtHoaTuyet = (getLifeStage(dt.hanh, dt.changed.branch) === 'Tuyệt');

            // Hóa Phá: Nguyệt phá hoặc Nhật phá (khi hào biến suy)
            const isNguyetPha = isBranchXung(dt.changed.branch, cal.thang.chi);
            const changedVung = getLineVungScore({ chi: dt.changed.branch, hanh: dt.changed.hanh, isMoving: false }, cal);
            const isNhatPha = isBranchXung(dt.changed.branch, cal.ngay.chi) && !changedVung.isVung;
            const dtHoaPha = (isNguyetPha || isNhatPha);

            if (dtHoiDauKhac || dtHoaThoai) {
                let note = dtHoiDauKhac ? 'Hóa Hồi Đầu Khắc' : 'Hóa Thoái Thần';
                return {
                    isQualified: false,
                    score: 15,
                    grade: 'Dụng Thần Suy Bại',
                    reasons: [`Dụng Thần ${targetRel} động ${note} (Dụng Thần suy bại - Bắt buộc loại bỏ 100%).`]
                };
            }

            if (!dtHoiDauSinh && !dtHoiDauKhac && !dtHoaTien && !dtHoaThoai) {
                if (dtHoaTuyet || dtHoaPha) {
                    let note = dtHoaTuyet ? 'Hóa Tuyệt' : 'Hóa Phá (Nguyệt/Nhật Phá)';
                    return {
                        isQualified: false,
                        score: 15,
                        grade: 'Dụng Thần Suy Bại',
                        reasons: [`Dụng Thần ${targetRel} động ${note} (Dụng Thần suy bại - Bắt buộc loại bỏ 100%).`]
                    };
                }
            }
        }
    }

    // --- 3. QUY TẮC: HÀO ĐỘNG KHẮC DỤNG THẦN ➔ DỤNG THẦN SUY ➔ BỎ 100% ---
    const dongKhacDung = hexData.linesData.find(dL => dL.isMoving && dungThanLines.some(dt => isOvercoming(dL.hanh, dt.hanh)));
    if (dongKhacDung) {
        return {
            isQualified: false,
            score: 15,
            grade: 'Dụng Thần Bị Khắc',
            reasons: [`Hào Động (${dongKhacDung.chi} - ${dongKhacDung.hanh}) tương khắc Dụng Thần ${targetRel} ➔ Dụng Thần bị tổn hại suy vi (Bắt buộc loại bỏ 100%).`]
        };
    }

    // --- 4. KIỂM TRA BẮT BUỘC: DỤNG THẦN PHẢI VƯỢNG ---
    let maxDungScore = 0;
    let maxDungNote = '';
    let dungThanBestLine = null;
    let dungThanDuocDongSinh = false;

    dungThanLines.forEach(dt => {
        const vInfo = getLineVungScore(dt, cal);
        if (vInfo.score > maxDungScore) {
            maxDungScore = vInfo.score;
            maxDungNote = vInfo.note;
            dungThanBestLine = dt;
        }

        // Ưu tiên tác dụng Hào Động sinh Dụng Thần (Hào động sinh Dụng thần tốt hơn Nhật Nguyệt)
        hexData.linesData.forEach(dL => {
            if (dL.isMoving && isGenerating(dL.hanh, dt.hanh)) {
                dungThanDuocDongSinh = true;
                const dVung = getLineVungScore(dL, cal);
                reasons.push(`🔥 Hào Động (${dL.chi} - ${dL.hanh}) [${dVung.note}] ĐỘNG SINH DỤNG THẦN (${targetRel}) - Lực tác dụng mạnh hơn Nhật Nguyệt (Đại Cát).`);
            }
        });
    });

    if (maxDungScore <= 0 && !dungThanDuocDongSinh) {
        return {
            isQualified: false,
            score: 20,
            grade: 'Dụng Thần Suy',
            reasons: [`Dụng Thần ${targetRel} bị suy vi tại Nhật Nguyệt và không được Hào Động tương sinh (Dụng Thần Suy thì Hào Thế vượng mấy cũng HUNG, bắt buộc loại bỏ).`]
        };
    }

    if (maxDungScore > 0) {
        reasons.push(`Dụng Thần ${targetRel} (${dungThanBestLine.chi}) Vượng Hưng: ${maxDungNote}.`);
    }
    totalScore += maxDungScore;

    // --- 5. QUY TẮC: HÀO THẾ BỊ SUY HOẶC BỊ KHẮC ➔ BỎ HẾT (CHO DÙ DỤNG THẦN VƯỢNG!) ---
    const theVungInfo = getLineVungScore(haoThe, cal);

    // Kiểm tra Hào Thế Bị Khắc (bởi Nhật, Nguyệt, Hào Động, Hồi đầu khắc)
    const bịNhậtKhắc = isOvercoming(nhatHanh, theHanh);
    const bịNguyệtKhắc = isOvercoming(nguyetHanh, theHanh);
    const bịĐộngKhắc = hexData.linesData.find(dL => dL.isMoving && !dL.isShi && isOvercoming(dL.hanh, theHanh));

    if (bịNhậtKhắc || bịNguyệtKhắc || bịĐộngKhắc) {
        let note = bịNhậtKhắc ? 'Nhật Thần' : bịNguyệtKhắc ? 'Nguyệt Lệnh' : `Hào Động (${bịĐộngKhắc.chi})`;
        return {
            isQualified: false,
            score: 10,
            grade: 'Hào Thế Bị Khắc',
            reasons: [`Hào Thế (${theChi}) bị ${note} tương khắc (Hào Thế bị khắc thì dù Dụng Thần vượng cũng HUNG, bắt buộc loại bỏ 100%).`]
        };
    }

    // Kiểm tra Hào Thế Bị Suy (không đạt thế vượng tại Nhật/Nguyệt)
    if (theVungInfo.score <= 0) {
        return {
            isQualified: false,
            score: 15,
            grade: 'Hào Thế Suy',
            reasons: [`Hào Thế (${theChi}) bị suy vi tại Nhật Nguyệt (Hào Thế suy thì dù Dụng Thần vượng cũng KHÔNG CÓ TÁC DỤNG, bắt buộc loại bỏ 100%).`]
        };
    }

    // Kiểm tra Hào Thế động Hóa Bại
    if (haoThe.isMoving) {
        const hoiDauKhac = isOvercoming(haoThe.changed.hanh, theHanh);
        const hoaThoai = isRegressingBranch(theChi, haoThe.changed.branch);
        const hoaTuyet = (getLifeStage(theHanh, haoThe.changed.branch) === 'Tuyệt');
        const hoaKyThan = (kyThan && haoThe.changed.relation.startsWith(kyThan.split(' ')[0]));

        if (hoiDauKhac || hoaThoai || hoaTuyet || hoaKyThan) {
            let note = hoiDauKhac ? 'Hóa Hồi Đầu Khắc' : hoaThoai ? 'Hóa Thoái Thần' : hoaTuyet ? 'Hóa Tuyệt' : 'Hóa Kỵ Thần';
            return {
                isQualified: false,
                score: 15,
                grade: 'Thế Suy Bại',
                reasons: [`Hào Thế động ${note} (Thuộc thế suy bại, bắt buộc loại bỏ 100%).`]
            };
        }
    }

    // --- 6. TƯƠNG TÁC HÀO ĐỘNG / DỤNG THẦN KHẮC HÀO THẾ ---
    const dungKhacThe = dungThanLines.find(dt => dt.isMoving && isOvercoming(dt.hanh, theHanh));
    if (dungKhacThe) {
        if (purpose === 'cautai') {
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
                    reasons: ['Tài lai khắc Thế nhưng Hào Thế không vượng ở CẢ Nhật lẫn Nguyệt (Bắt buộc loại bỏ).']
                };
            }
        } else {
            return {
                isQualified: false,
                score: 15,
                grade: 'Dụng Thần Khắc Thế',
                reasons: [`Dụng Thần ${targetRel} tương khắc Hào Thế (${theChi}) ➔ Hào Thế bị thương hại (Bắt buộc loại bỏ).`]
            };
        }
    }

    // --- 7. QUY TẮC: DỤNG THẦN XUNG HOẶC HỢP HÀO THẾ ---
    const dtXungThe = dungThanLines.find(dt => isBranchXung(dt.chi, theChi));
    const dtHopThe = dungThanLines.find(dt => isBranchHarmonious(dt.chi, theChi));

    if (dtXungThe || dtHopThe) {
        const activeDt = dtXungThe || dtHopThe;
        let note = dtXungThe ? 'Lục Xung' : 'Lục Hợp';

        if (theVungInfo.score <= 0) {
            return {
                isQualified: false,
                score: 15,
                grade: 'Dụng Thần Xung/Hợp Thế Suy',
                reasons: [`Dụng Thần ${targetRel} ${note} Hào Thế nhưng Hào Thế (${theChi}) bị suy vi tại Nhật Nguyệt (Bắt buộc loại bỏ 100%).`]
            };
        } else {
            totalScore += 25;
            reasons.push(`🔥 Dụng Thần ${targetRel} (${activeDt.chi}) ${note} Hào Thế Vượng (${theChi}) - Đạt Cát Tường Tương Đương Dụng Thần Sinh Thế (Đại Cát)!`);
        }
    }

    // --- 8. ĐÁNH GIÁ HÓA CÁT CỦA HÀO THẾ (KHÍ THẾ ĐÃ AN TOÀN & VƯỢNG) ---
    totalScore += theVungInfo.score;

    if (haoThe.isMoving) {
        const hoiDauSinhDung = dungThanLines.some(dt => haoThe.changed.relation.startsWith(dt.relation.split(' ')[0]) && isGenerating(haoThe.changed.hanh, theHanh));
        const hoaTien = isProgressingBranch(theChi, haoThe.changed.branch);
        const hoaDungThan = dungThanLines.some(dt => haoThe.changed.relation.startsWith(dt.relation.split(' ')[0]));

        if (hoiDauSinhDung) {
            totalScore += 30;
            reasons.push(`🌟 Hào Thế Động Hóa Ra Dụng Thần (${targetRel}) Hồi Đầu Sinh (Cát Tường Cấp 1 - Tối Cát).`);
        } else if (hoaTien) {
            totalScore += 25;
            reasons.push(`✨ Hào Thế Động Hóa Tiến Thần (${haoThe.changed.branch}) - Cát Tường Cấp 2.`);
        } else if (hoaDungThan) {
            totalScore += 20;
            reasons.push(`Hào Thế Động Hóa Ra Dụng Thần (${targetRel}) - Cát Tường Cấp 3.`);
        } else {
            reasons.push(`Hào Thế Động (${theChi}) Vượng Hưng: ${theVungInfo.note}.`);
        }
    } else {
        reasons.push(`Hào Thế Tĩnh (${theChi}) Vượng Hưng: ${theVungInfo.note}.`);
    }

    // --- 9. TƯƠNG TÁC HÀO ĐỘNG VỚI HÀO THẾ & NGUYÊN/KỴ THẦN ---
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
        let dungThanDongSinhThe = false;

        hexData.linesData.forEach(dL => {
            if (dL.isMoving) {
                // Ưu tiên: Hào Động Sinh Thế -> TỐT NHẤT
                if (isGenerating(dL.hanh, theHanh)) {
                    dungThanDongSinhThe = true;
                    totalScore += 25;
                    reasons.push(`🔥 Hào Động (${dL.chi} - ${dL.hanh}) ĐỘNG SINH HÀO THẾ (${theChi}) - Mẫu quẻ Cát Tường Bậc Nhất!`);
                }

                // Tương tác tới Nguyên Thần / Kỵ Thần
                if (nguyenThan && dL.relation.startsWith(nguyenThan.split(' ')[0])) {
                    totalScore += 15;
                    reasons.push(`Hào Động (${dL.chi}) làm Nguyên Thần sinh trợ Dụng Thần (${targetRel}).`);
                }
            }
        });
    }

    // Quẻ Chủ Cát Tường
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
