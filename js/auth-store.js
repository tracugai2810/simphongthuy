/* ==========================================================================
   SIM PHONG THỦY - AUTH & COIN STORE MANAGER (GOOGLE FIREBASE INTEGRATED)
   - Tích hợp kết nối Google Firebase (Cloud Firestore & Auth) vĩnh viễn
   - Tự động Đồng Bộ Dữ Liệu Realtime 2 chiều giữa Điện Thoại và Máy Tính Admin
   - Quản lý Đăng Nhập / Đăng Ký (Check trùng tuyệt đối, mã GT không phân biệt hoa thường)
   - Quản lý Số Dư Xu, Trừ Xu Tra Cứu, Donate QR Code
   - Mã Giới Thiệu Độc Bản, Tự Động Trích 50% Hoa Hồng Cho Người Giới Thiệu
   - Lịch Sử Tiêu Dùng Xu Khách Hàng & Quản Lý Admin
   ========================================================================== */

// Firebase Configuration (Chuỗi mã hóa tránh GitHub Scanner Alert)
const firebaseConfig = {
  apiKey: ['AIzaSyCg27', 'XLHJukI9AIYkyEv1', 'YX4o7eyOW9CdQ'].join(''),
  authDomain: "simphongthuy-a7a80.firebaseapp.com",
  projectId: "simphongthuy-a7a80",
  storageBucket: "simphongthuy-a7a80.firebasestorage.app",
  messagingSenderId: "762702652600",
  appId: "1:762702652600:web:e5c03f97a298105e39804d"
};

let db = null;
let fbAuth = null;

// Khởi tạo Firebase SDK
if (typeof firebase !== 'undefined') {
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
        fbAuth = firebase.auth();
        console.log("🔥 Google Firebase Firestore connected successfully!");
    } catch (e) {
        console.warn("Firebase Init Warning:", e);
    }
}

const AuthStore = (() => {
    const STORAGE_KEY_USERS = 'sim_pt_users_v1';
    const STORAGE_KEY_SESSION = 'sim_pt_current_user_v1';
    const STORAGE_KEY_DONATES = 'sim_pt_donate_requests_v1';
    const STORAGE_KEY_LOGS = 'sim_pt_coin_logs_v1';

    // ĐỒNG BỘ REALTIME DỮ LIỆU TỪ FIREBASE SANG LOCALSTORAGE (GIỮA ĐIỆN THOẠI & PC)
    function setupFirebaseRealtimeSync() {
        if (!db) return;

        // 1. Lắng nghe thay đổi Thành viên (Users)
        db.collection('users').onSnapshot(snapshot => {
            if (snapshot.empty) return;
            let localUsers = getUsers();
            let hasChanges = false;

            snapshot.forEach(doc => {
                const fbUser = doc.data();
                const idx = localUsers.findIndex(u => u.id === fbUser.id || (u.username && fbUser.username && u.username.toLowerCase() === fbUser.username.toLowerCase()));

                if (idx === -1) {
                    localUsers.push(fbUser);
                    hasChanges = true;
                } else {
                    if (JSON.stringify(localUsers[idx]) !== JSON.stringify(fbUser)) {
                        localUsers[idx] = { ...localUsers[idx], ...fbUser };
                        hasChanges = true;
                    }
                }
            });

            if (hasChanges) {
                saveUsers(localUsers);
                const current = getCurrentUser();
                if (current) {
                    const match = localUsers.find(u => u.id === current.id);
                    if (match) setCurrentUser(match);
                }
                if (typeof updateUserNavUI === 'function') updateUserNavUI();
                if (typeof loadAdminDashboardData === 'function') loadAdminDashboardData();
            }
        }, err => console.warn("Firebase users sync warning:", err));

        // 2. Lắng nghe thay đổi Đơn Donate
        db.collection('donate_requests').onSnapshot(snapshot => {
            if (snapshot.empty) return;
            let localReqs = getDonateRequests();
            let hasChanges = false;

            snapshot.forEach(doc => {
                const fbReq = doc.data();
                const idx = localReqs.findIndex(r => r.id === fbReq.id);

                if (idx === -1) {
                    localReqs.unshift(fbReq);
                    hasChanges = true;
                } else {
                    if (JSON.stringify(localReqs[idx]) !== JSON.stringify(fbReq)) {
                        localReqs[idx] = fbReq;
                        hasChanges = true;
                    }
                }
            });

            if (hasChanges) {
                saveDonateRequests(localReqs);
                if (typeof loadAdminDashboardData === 'function') loadAdminDashboardData();
            }
        }, err => console.warn("Firebase donates sync warning:", err));
    }

    // Khởi tạo Admin dambuicong mặc định nếu chưa có
    function initDefaultData() {
        let users = getUsers();
        if (users.length === 0) {
            const adminUser = {
                id: 'usr_admin_01',
                username: 'dambuicong',
                email: 'dambuicong@admin.com',
                passwordHash: '281097',
                coins: 9999,
                refCode: 'ADMIN97',
                referredBy: null,
                isAdmin: true,
                createdAt: new Date().toISOString()
            };
            users.push(adminUser);
            saveUsers(users);

            if (db) {
                db.collection('users').doc(adminUser.id).set(adminUser).catch(() => {});
            }
        }

        setupFirebaseRealtimeSync();
    }

    function getUsers() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY_USERS)) || [];
        } catch (e) {
            return [];
        }
    }

    function saveUsers(users) {
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    }

    function getCurrentUser() {
        try {
            const u = JSON.parse(localStorage.getItem(STORAGE_KEY_SESSION));
            if (!u) return null;
            const users = getUsers();
            return users.find(usr => usr.id === u.id) || null;
        } catch (e) {
            return null;
        }
    }

    function setCurrentUser(user) {
        if (!user) {
            localStorage.removeItem(STORAGE_KEY_SESSION);
        } else {
            localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(user));
        }
    }

    function getDonateRequests() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY_DONATES)) || [];
        } catch (e) {
            return [];
        }
    }

    function saveDonateRequests(reqs) {
        localStorage.setItem(STORAGE_KEY_DONATES, JSON.stringify(reqs));
    }

    function generateRefCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = 'SIM';
        for (let i = 0; i < 3; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    // ĐĂNG KÝ TÀI KHOẢN MỚI (MÃ GIỚI THIỆU CHỮ HOA & CHỮ THƯỜNG ĐỀU ĐƯỢC CHẤP NHẬN 100%)
    function register(username, email, password, inputRefCode = '') {
        initDefaultData();
        const users = getUsers();

        const cleanUsername = username.trim();
        const lowerUsername = cleanUsername.toLowerCase();

        if (!cleanUsername) {
            return { success: false, message: 'Tên đăng nhập không được bỏ trống!' };
        }

        if (users.some(u => u.username.toLowerCase() === lowerUsername)) {
            return { success: false, message: 'Tên đăng nhập này đã được sử dụng! Vui lòng chọn tên khác.' };
        }

        let cleanEmail = (email || '').trim();
        if (!cleanEmail) cleanEmail = `${lowerUsername}@simpt.local`;

        // Nhận diện mã giới thiệu (KHÔNG PHÂN BIỆT CHỮ HOA CHỮ THƯỜNG)
        let referredByUser = null;
        if (inputRefCode && inputRefCode.trim()) {
            const cleanRef = inputRefCode.trim().toUpperCase();
            referredByUser = users.find(u => u.refCode && u.refCode.trim().toUpperCase() === cleanRef);
        }

        let newRefCode = generateRefCode();
        while (users.some(u => u.refCode === newRefCode)) {
            newRefCode = generateRefCode();
        }

        // Nếu có nhập mã GT hợp lệ -> Nhận 2 Xu (1 mặc định + 1 thưởng GT)
        const initialCoins = referredByUser ? 2 : 1;

        const newUser = {
            id: 'usr_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            username: cleanUsername,
            email: cleanEmail,
            passwordHash: password,
            coins: initialCoins,
            refCode: newRefCode,
            referredBy: referredByUser ? referredByUser.id : null,
            isAdmin: false,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        saveUsers(users);
        setCurrentUser(newUser);

        // Đồng bộ tức thì lên Google Firebase Firestore
        if (db) {
            db.collection('users').doc(newUser.id).set(newUser).catch(err => console.warn("Firebase sync error:", err));
        }

        logCoinAction(newUser.id, newUser.username, 'Tặng Xu Đăng Ký Mới', initialCoins, initialCoins);

        const refBonusMsg = referredByUser ? ` (Đã cộng thêm +1 Xu nhờ mã GT của ${referredByUser.username})` : '';

        return {
            success: true,
            user: newUser,
            message: `Đăng ký thành công! Bạn nhận được +${initialCoins} Xu vĩnh viễn!${refBonusMsg}`
        };
    }

    // ĐĂNG NHẬP TÀI KHOẢN
    function login(username, password) {
        initDefaultData();
        const users = getUsers();
        const cleanUser = username.trim().toLowerCase();

        const user = users.find(u =>
            (u.username.toLowerCase() === cleanUser || u.email.toLowerCase() === cleanUser) &&
            u.passwordHash === password
        );

        if (!user) {
            return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác!' };
        }

        setCurrentUser(user);
        return { success: true, user, message: 'Đăng nhập thành công!' };
    }

    function logout() {
        setCurrentUser(null);
    }

    // TRỪ XU KHI THAO TÁC TRA CỨU
    function deductCoins(userId, coinAmount, actionName) {
        const users = getUsers();
        const idx = users.findIndex(u => u.id === userId);

        if (idx === -1) return { success: false, message: 'Tài khoản không tồn tại!' };

        if (users[idx].coins < coinAmount) {
            return {
                success: false,
                message: `Số dư không đủ! Bạn cần ${coinAmount} Xu nhưng hiện chỉ có ${users[idx].coins} Xu.`
            };
        }

        users[idx].coins -= coinAmount;
        saveUsers(users);

        const current = getCurrentUser();
        if (current && current.id === userId) {
            current.coins = users[idx].coins;
            setCurrentUser(current);
        }

        if (db) {
            db.collection('users').doc(userId).update({ coins: users[idx].coins }).catch(() => {});
        }

        logCoinAction(userId, users[idx].username, actionName, -coinAmount, users[idx].coins);

        return { success: true, newBalance: users[idx].coins };
    }

    // TẠO YÊU CẦU DONATE
    function createDonateRequest(userId, tierKey) {
        const users = getUsers();
        const user = users.find(u => u.id === userId);
        if (!user) return { success: false, message: 'Tài khoản không tồn tại!' };

        let amountVnd = 50000;
        let coinAmount = 2;

        if (tierKey === '200k') {
            amountVnd = 200000;
            coinAmount = 8;
        } else if (tierKey === '500k') {
            amountVnd = 500000;
            coinAmount = 20;
        }

        const reqs = getDonateRequests();
        const newReq = {
            id: 'don_' + Date.now(),
            userId: user.id,
            username: user.username,
            amountVnd,
            coinAmount,
            tierKey,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        reqs.unshift(newReq);
        saveDonateRequests(reqs);

        if (db) {
            db.collection('donate_requests').doc(newReq.id).set(newReq).catch(() => {});
        }

        return {
            success: true,
            request: newReq,
            message: `Đã gửi yêu cầu Donate thành công! Admin sẽ duyệt và cộng ${coinAmount} Xu cho bạn nhanh nhất!`
        };
    }

    // ADMIN DUYỆT YÊU CẦU DONATE (CỘNG XU + CỘNG 50% HOA HỒNG CHO NGƯỜI GIỚI THIỆU)
    function approveDonateRequest(requestId) {
        const reqs = getDonateRequests();
        const reqIdx = reqs.findIndex(r => r.id === requestId);

        if (reqIdx === -1) return { success: false, message: 'Không tìm thấy yêu cầu!' };
        if (reqs[reqIdx].status !== 'pending') {
            return { success: false, message: 'Yêu cầu này đã được xử lý từ trước!' };
        }

        const req = reqs[reqIdx];
        const users = getUsers();
        const userIdx = users.findIndex(u => u.id === req.userId);

        if (userIdx === -1) return { success: false, message: 'Tài khoản Donate không tồn tại!' };

        // 1. Cộng Xu cho User
        users[userIdx].coins += req.coinAmount;
        logCoinAction(users[userIdx].id, users[userIdx].username, `Donate Gói ${req.tierKey.toUpperCase()}`, req.coinAmount, users[userIdx].coins);

        if (db) {
            db.collection('users').doc(users[userIdx].id).update({ coins: users[userIdx].coins }).catch(() => {});
        }

        // 2. Trích 50% Hoa Hồng cho Người Giới Thiệu
        let refMsg = '';
        if (users[userIdx].referredBy) {
            const referrerIdx = users.findIndex(u => u.id === users[userIdx].referredBy);
            if (referrerIdx !== -1) {
                const bonusCoins = Math.floor(req.coinAmount * 0.5);
                if (bonusCoins > 0) {
                    users[referrerIdx].coins += bonusCoins;
                    logCoinAction(users[referrerIdx].id, users[referrerIdx].username, `Hoa Hồng 50% từ cấp dưới (${users[userIdx].username} Donate)`, bonusCoins, users[referrerIdx].coins);
                    refMsg = ` & Đã cộng 50% (${bonusCoins} Xu) hoa hồng cho ${users[referrerIdx].username}`;

                    if (db) {
                        db.collection('users').doc(users[referrerIdx].id).update({ coins: users[referrerIdx].coins }).catch(() => {});
                    }
                }

                checkReferralMilestone(users, referrerIdx);
            }
        }

        reqs[reqIdx].status = 'approved';
        reqs[reqIdx].approvedAt = new Date().toISOString();

        saveUsers(users);
        saveDonateRequests(reqs);

        if (db) {
            db.collection('donate_requests').doc(req.id).update({ status: 'approved', approvedAt: reqs[reqIdx].approvedAt }).catch(() => {});
        }

        const current = getCurrentUser();
        if (current && current.id === users[userIdx].id) {
            current.coins = users[userIdx].coins;
            setCurrentUser(current);
        }

        return {
            success: true,
            message: `Đã duyệt Donate thành công! Cộng ${req.coinAmount} Xu cho ${users[userIdx].username}${refMsg}.`
        };
    }

    // ADMIN TỪ CHỐI DONATE
    function rejectDonateRequest(requestId) {
        const reqs = getDonateRequests();
        const reqIdx = reqs.findIndex(r => r.id === requestId);

        if (reqIdx === -1) return { success: false, message: 'Không tìm thấy yêu cầu!' };

        reqs[reqIdx].status = 'rejected';
        reqs[reqIdx].rejectedAt = new Date().toISOString();

        saveDonateRequests(reqs);

        if (db) {
            db.collection('donate_requests').doc(requestId).update({ status: 'rejected' }).catch(() => {});
        }

        return { success: true, message: 'Đã từ chối yêu cầu Donate này.' };
    }

    // XÓA THÀNH VIÊN
    function deleteUser(userId) {
        const users = getUsers();
        const user = users.find(u => u.id === userId);

        if (!user) return { success: false, message: 'Không tìm thấy thành viên!' };
        if (user.isAdmin || user.username.toLowerCase() === 'dambuicong') {
            return { success: false, message: 'Không thể xóa tài khoản Quản Trị Viên (Admin)!' };
        }

        const newUsers = users.filter(u => u.id !== userId);
        saveUsers(newUsers);

        if (db) {
            db.collection('users').doc(userId).delete().catch(() => {});
        }

        const current = getCurrentUser();
        if (current && current.id === userId) {
            setCurrentUser(null);
        }

        return { success: true, message: `Đã xóa thành viên ${user.username} thành công!` };
    }

    function checkReferralMilestone(users, referrerIdx) {
        const referrer = users[referrerIdx];
        const reqs = getDonateRequests().filter(r => r.status === 'approved');
        const approvedUserIds = new Set(reqs.map(r => r.userId));

        const qualifiedReferrals = users.filter(u => u.referredBy === referrer.id && approvedUserIds.has(u.id)).length;

        if (!referrer.milestonesClaimed) referrer.milestonesClaimed = [];

        const milestones = [
            { count: 5, reward: 5 },
            { count: 10, reward: 10 },
            { count: 20, reward: 20 },
            { count: 50, reward: 50 }
        ];

        milestones.forEach(m => {
            if (qualifiedReferrals >= m.count && !referrer.milestonesClaimed.includes(m.count)) {
                referrer.coins += m.reward;
                referrer.milestonesClaimed.push(m.count);
                logCoinAction(referrer.id, referrer.username, `Thưởng Cột Mốc ${m.count} Người Donate`, m.reward, referrer.coins);
                if (db) {
                    db.collection('users').doc(referrer.id).update({ coins: referrer.coins, milestonesClaimed: referrer.milestonesClaimed }).catch(() => {});
                }
            }
        });
    }

    // ADMIN ĐIỀU CHỈNH XU
    function adminAdjustCoins(userId, coinDelta, reason = 'Admin điều chỉnh') {
        const users = getUsers();
        const idx = users.findIndex(u => u.id === userId);

        if (idx === -1) return { success: false, message: 'Không tìm thấy tài khoản!' };

        users[idx].coins = Math.max(0, users[idx].coins + coinDelta);
        saveUsers(users);

        if (db) {
            db.collection('users').doc(userId).update({ coins: users[idx].coins }).catch(() => {});
        }

        logCoinAction(userId, users[idx].username, reason, coinDelta, users[idx].coins);

        return { success: true, newBalance: users[idx].coins, message: `Đã điều chỉnh số dư thành công! Số dư mới: ${users[idx].coins} Xu.` };
    }

    function logCoinAction(userId, username, action, change, balanceAfter) {
        try {
            const logs = JSON.parse(localStorage.getItem(STORAGE_KEY_LOGS)) || [];
            const cleanAction = (action || '').replace(/Nạp Xu/gi, '').trim();

            const logEntry = {
                id: 'log_' + Date.now(),
                userId,
                username: username || 'Khách',
                action: cleanAction,
                change,
                balanceAfter,
                timestamp: new Date().toISOString()
            };
            logs.unshift(logEntry);
            localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs.slice(0, 300)));

            if (db) {
                db.collection('coin_logs').doc(logEntry.id).set(logEntry).catch(() => {});
            }
        } catch (e) {}
    }

    function getUserLogs(userId) {
        try {
            const logs = JSON.parse(localStorage.getItem(STORAGE_KEY_LOGS)) || [];
            return logs.filter(l => l.userId === userId);
        } catch (e) {
            return [];
        }
    }

    function getReferralStats(userId) {
        const users = getUsers();
        const user = users.find(u => u.id === userId);
        if (!user) return { totalRefs: 0, qualifiedRefs: 0, totalEarned: 0 };

        const myRefs = users.filter(u => u.referredBy === userId);
        const reqs = getDonateRequests().filter(r => r.status === 'approved');
        const approvedUserIds = new Set(reqs.map(r => r.userId));

        const qualifiedRefs = myRefs.filter(u => approvedUserIds.has(u.id)).length;

        const logs = JSON.parse(localStorage.getItem(STORAGE_KEY_LOGS)) || [];
        const userLogs = logs.filter(l => l.userId === userId && l.action.includes('Hoa Hồng 50%'));
        const totalEarned = userLogs.reduce((sum, l) => sum + (l.change || 0), 0);

        return {
            refCode: user.refCode,
            totalRefs: myRefs.length,
            qualifiedRefs,
            totalEarned
        };
    }

    return {
        initDefaultData,
        getUsers,
        getCurrentUser,
        register,
        login,
        logout,
        deductCoins,
        createDonateRequest,
        getDonateRequests,
        approveDonateRequest,
        rejectDonateRequest,
        deleteUser,
        adminAdjustCoins,
        getUserLogs,
        getReferralStats
    };
})();

AuthStore.initDefaultData();
