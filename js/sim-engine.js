/* ==========================================================================
   SIM PHONG THỦY ENGINE & EVALUATOR - CHUẨN ĐÃI LỌC DỊCH HỌC LỤC HÀO PRO
   Diễn giải đơn giản, dễ hiểu cho Khách Hàng (Tập trung Vượng/Suy/Cát/Hung)
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

function getLineVungScore(line, cal) {
    const chi = line.chi;
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
                note: `Động hóa sinh trợ vượng khí`
            };
        } else {
            if (isLamNhatNguyet || isNguyetHop) return { score: 35, isVung: true, note: 'Lâm/Hợp Nhật Nguyệt vượng khí' };
            if (isNguyetSinhPho) return { score: 28, isVung: true, note: 'Nguyệt Lệnh sinh phò vượng khí' };
            return { score: 0, isVung: false, note: 'Bị hưu tù suy vi' };
        }
    } else {
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
   HÀM ĐÁNH GIÁ PHONG THỦY SIM - DỄ HIỂU CHO KHÁCH HÀNG
   ========================================================================== */
function evaluateSimFengShui(simStr, hexData, cal, purpose, gender) {
    if (!hexData) return { isQualified: false, score: 0, grade: 'Không hợp lệ', reasons: ['Không thể lập quẻ.'] };

    const reasons = [];
    let totalScore = 40;

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
            reasons: [`Dụng Thần (${targetRel}) không xuất hiện trong quẻ (Thiếu yếu tố may mắn cầu như ý).`]
        };
    }

    // Dụng Thần Động Hóa Bại
    for (let dt of dungThanLines) {
        if (dt.isMoving) {
            const dtHoiDauSinh = isGenerating(dt.changed.hanh, dt.hanh);
            const dtHoiDauKhac = isOvercoming(dt.changed.hanh, dt.hanh);
            const dtHoaTien = isProgressingBranch(dt.chi, dt.changed.branch);
            const dtHoaThoai = isRegressingBranch(dt.chi, dt.changed.branch);
            const dtHoaTuyet = (getLifeStage(dt.hanh, dt.changed.branch) === 'Tuyệt');

            const isNguyetPha = isBranchXung(dt.changed.branch, cal.thang.chi);
            const changedVung = getLineVungScore({ chi: dt.changed.branch, hanh: dt.changed.hanh, isMoving: false }, cal);
            const isNhatPha = isBranchXung(dt.changed.branch, cal.ngay.chi) && !changedVung.isVung;
            const dtHoaPha = (isNguyetPha || isNhatPha);

            if (dtHoiDauKhac || dtHoaThoai || dtHoaTuyet || dtHoaPha) {
                return {
                    isQualified: false,
                    score: 15,
                    grade: 'Dụng Thần Suy Bại',
                    reasons: [`Dụng Thần (${targetRel}) bị suy biến (Vận may bị suy giảm, không phù hợp).`]
                };
            }
        }
    }

    // Hào Động Khắc Dụng Thần
    const dongKhacDung = hexData.linesData.find(dL => dL.isMoving && dungThanLines.some(dt => isOvercoming(dL.hanh, dt.hanh)));
    if (dongKhacDung) {
        return {
            isQualified: false,
            score: 15,
            grade: 'Dụng Thần Bị Khắc',
            reasons: [`Dụng Thần (${targetRel}) bị Hào Động tương khắc (Cản trở vận may, không tốt).`]
        };
    }

    // Kiểm tra Dụng Thần Phải Vượng
    let maxDungScore = 0;
    let maxDungNote = '';
    let dungThanBestLine = null;
    let dungThanDuocDongSinh = false;
    let dungThanIsVung = false;

    dungThanLines.forEach(dt => {
        const vInfo = getLineVungScore(dt, cal);
        if (vInfo.score > maxDungScore) {
            maxDungScore = vInfo.score;
            maxDungNote = vInfo.note;
            dungThanBestLine = dt;
        }
        if (vInfo.isVung) {
            dungThanIsVung = true;
        }

        hexData.linesData.forEach(dL => {
            if (dL.isMoving && isGenerating(dL.hanh, dt.hanh)) {
                dungThanDuocDongSinh = true;
                reasons.push(`🔥 Quẻ có Hào Động tương sinh Dụng Thần (${targetRel}) - Mang lại vận may rất lớn.`);
            }
        });
    });

    if (!dungThanIsVung && !dungThanDuocDongSinh) {
        return {
            isQualified: false,
            score: 20,
            grade: 'Dụng Thần Suy',
            reasons: [`Dụng Thần (${targetRel}) bị suy vi (Khí vận cầu công danh/tài lộc chưa đủ vượng).`]
        };
    }

    reasons.push(`Dụng Thần (${targetRel}) vượng khí, trợ vận may phát triển tốt.`);
    totalScore += maxDungScore;

    // Kiểm tra Hào Thế (Bản mệnh)
    const theVungInfo = getLineVungScore(haoThe, cal);

    const bịNhậtKhắc = isOvercoming(nhatHanh, theHanh);
    const bịNguyệtKhắc = isOvercoming(nguyetHanh, theHanh);
    const bịĐộngKhắc = hexData.linesData.find(dL => dL.isMoving && !dL.isShi && isOvercoming(dL.hanh, theHanh));

    if (bịNhậtKhắc || bịNguyệtKhắc || bịĐộngKhắc) {
        return {
            isQualified: false,
            score: 10,
            grade: 'Hào Thế Bị Khắc',
            reasons: [`Hào Thế (bản mệnh) bị xung khắc (Khí vận không an ổn, không gánh được tài lộc).`]
        };
    }

    if (haoThe.isMoving) {
        const hoiDauKhac = isOvercoming(haoThe.changed.hanh, theHanh);
        const hoaThoai = isRegressingBranch(theChi, haoThe.changed.branch);
        const hoaTuyet = (getLifeStage(theHanh, haoThe.changed.branch) === 'Tuyệt');
        const hoaKyThan = (kyThan && haoThe.changed.relation.startsWith(kyThan.split(' ')[0]));

        if (hoiDauKhac || hoaThoai || hoaTuyet || hoaKyThan) {
            return {
                isQualified: false,
                score: 15,
                grade: 'Thế Suy Bại',
                reasons: [`Hào Thế (bản mệnh) bị suy biến (Vận trình bản thân thiếu sự vững vàng).`]
            };
        }
    }

    const isTheNhatSinh = (theHanh === nhatHanh || isGenerating(nhatHanh, theHanh));
    const isTheNguyetSinh = (theHanh === nguyetHanh || isGenerating(nguyetHanh, theHanh));
    const isTheLamNguyetHop = (theChi === nhatChi || theChi === nguyetChi || isBranchHarmonious(theChi, nguyetChi) || (!haoThe.isMoving && isBranchHarmonious(theChi, nhatChi)));
    const isTheHung = theVungInfo.isVung || isTheNhatSinh || isTheNguyetSinh || isTheLamNguyetHop;

    if (targetRel === 'Thế') {
        if (!theVungInfo.isVung && !dungThanDuocDongSinh) {
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

    // Tương tác Dụng Thần khắc Thế
    const dungKhacThe = dungThanLines.find(dt => dt.isMoving && isOvercoming(dt.hanh, theHanh));
    if (dungKhacThe) {
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

    // Dụng Thần Xung/Hợp Thế
    const dtXungThe = dungThanLines.find(dt => isBranchXung(dt.chi, theChi));
    const dtHopThe = dungThanLines.find(dt => isBranchHarmonious(dt.chi, theChi));

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
        const hoiDauSinhDung = dungThanLines.some(dt => haoThe.changed.relation.startsWith(dt.relation.split(' ')[0]) && isGenerating(haoThe.changed.hanh, theHanh));
        const hoaTien = isProgressingBranch(theChi, haoThe.changed.branch);
        const hoaDungThan = dungThanLines.some(dt => haoThe.changed.relation.startsWith(dt.relation.split(' ')[0]));

        if (hoiDauSinhDung) {
            totalScore += 30;
            reasons.push(`🌟 Hào Thế động hóa Dụng Thần hồi đầu sinh (Mẫu quẻ hanh thông, đại cát tường).`);
        } else if (hoaTien) {
            totalScore += 25;
            reasons.push(`✨ Hào Thế động Hóa Tiến Thần (Vận trình bản thân ngày càng thăng tiến).`);
        } else if (hoaDungThan) {
            totalScore += 20;
            reasons.push(`Hào Thế động Hóa Dụng Thần (Hỗ trợ mục đích cầu thành công).`);
        } else {
            reasons.push(`Hào Thế (bản mệnh) động sinh trợ vượng khí.`);
        }
    }

    if (targetRel === 'Thế') {
        let hasGenDynamic = false;
        hexData.linesData.forEach(dL => {
            if (dL.isMoving && !dL.isShi && isGenerating(dL.hanh, theHanh)) {
                hasGenDynamic = true;
                totalScore += 25;
                reasons.push(`🔥 Quẻ có Hào Động tương sinh Hào Thế (Bình an, sức khỏe dồi dào, đại cát).`);
            }
        });
        if (!hasGenDynamic && haoThe.isMoving) {
            reasons.push(`Hào Thế (bản mệnh) Động Hóa Cát Tường.`);
        }
    } else {
        hexData.linesData.forEach(dL => {
            if (dL.isMoving) {
                if (isGenerating(dL.hanh, theHanh)) {
                    totalScore += 25;
                    reasons.push(`🔥 Quẻ có Hào Động tương sinh Hào Thế (Bản mệnh có quý nhân phù trợ, đại cát).`);
                }

                if (nguyenThan && dL.relation.startsWith(nguyenThan.split(' ')[0])) {
                    totalScore += 15;
                    reasons.push(`Hào Động sinh trợ Nguyên Thần (Nuôi dưỡng vận lộc rất tốt).`);
                }
            }
        });
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
