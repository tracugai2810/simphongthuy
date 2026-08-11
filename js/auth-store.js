/* ==========================================================================
   SIM PHONG THỦY - AUTH & COIN STORE MANAGER (GOOGLE FIREBASE INTEGRATED)
   - Khắc phục lỗi đồng bộ mật khẩu khi Admin đổi mật khẩu tài khoản
   - Đảm bảo mật khẩu mới được lưu và đồng bộ 100% vào Firestore Database
   ========================================================================== */

// Firebase Configuration
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

    // ĐỒNG BỘ REALTIME DỮ LIỆU TỪ FIREBASE SANG LOCALSTORAGE
    function setupFirebaseRealtimeSync() {
        if (!db) return;

        // 1. Đồng bộ Thành Viên
        db.collection('users').onSnapshot(snapshot => {
            if (snapshot.empty) return;
            let localUsers = getUsers();
            let hasChanges = false;

            snapshot.forEach(doc => {
                const fbUser = doc.data();
                
                // Tự động xóa và loại bỏ các bản ghi rác không hợp lệ (như doc id "undefined" hoặc thiếu username)
                if (!fbUser || !fbUser.username || fbUser.username === 'undefined' || !fbUser.username.trim()) {
                    if (db && (doc.id === 'undefined' || !fbUser || !fbUser.username || fbUser.username === 'undefined')) {
                        db.collection('users').doc(doc.id).delete().catch(() => {});
                    }
                    return;
                }

                const cleanFbUsername = fbUser.username.trim().toLowerCase();
                const idx = localUsers.findIndex(u => (u.id && fbUser.id && u.id === fbUser.id) || (u.username && u.username.trim().toLowerCase() === cleanFbUsername));

                if (idx === -1) {
                    if (fbUser.coins === 9999 && (cleanFbUsername === 'dambuicong' || fbUser.isAdmin)) {
                        fbUser.coins = 10;
                    }
                    localUsers.push(fbUser);
                    hasChanges = true;
                } else {
                    const localU = localUsers[idx];
                    const cleanFbUser = { ...fbUser };

                    if (cleanFbUser.coins === 9999 && (cleanFbUsername === 'dambuicong' || localU.isAdmin)) {
                        delete cleanFbUser.coins;
                    }

                    const fbTime = cleanFbUser.updatedAt ? new Date(cleanFbUser.updatedAt).getTime() : 0;
                    const localTime = localU.updatedAt ? new Date(localU.updatedAt).getTime() : 0;

                    let mergedUser;
                    if (fbTime >= localTime) {
                        mergedUser = { ...localU, ...cleanFbUser };
                    } else {
                        mergedUser = { ...cleanFbUser, ...localU };
                    }

                    if (JSON.stringify(localUsers[idx]) !== JSON.stringify(mergedUser)) {
                        localUsers[idx] = mergedUser;
                        hasChanges = true;
                    }
                }
            });

            if (hasChanges) {
                // Đảm bảo lọc sạch không còn bản ghi undefined hoặc trùng lặp username
                const sanitized = [];
                const seenNames = new Set();
                localUsers.forEach(u => {
                    if (!u || !u.username || u.username === 'undefined' || !u.username.trim()) return;
                    const key = u.username.trim().toLowerCase();
                    if (!seenNames.has(key)) {
                        seenNames.add(key);
                        sanitized.push(u);
                    }
                });

                saveUsers(sanitized);
                
                const current = getCurrentUser();
                if (typeof updateUserNavUI === 'function') updateUserNavUI();
                if (typeof loadAdminDashboardData === 'function') loadAdminDashboardData();
            }
        }, err => console.warn("Firebase users sync warning:", err));

        // 2. Đồng bộ Đơn Donate
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

        // 3. Đồng bộ Nhật Ký Giao Dịch (Coin Logs) Realtime!
        db.collection('coin_logs').onSnapshot(snapshot => {
            if (snapshot.empty) return;
            let localLogs = [];
            try {
                localLogs = JSON.parse(localStorage.getItem(STORAGE_KEY_LOGS)) || [];
            } catch (e) {}
            let hasChanges = false;

            snapshot.forEach(doc => {
                const fbLog = doc.data();
                const idx = localLogs.findIndex(l => l.id === fbLog.id);

                if (idx === -1) {
                    localLogs.push(fbLog);
                    hasChanges = true;
                } else {
                    if (JSON.stringify(localLogs[idx]) !== JSON.stringify(fbLog)) {
                        localLogs[idx] = fbLog;
                        hasChanges = true;
                    }
                }
            });

            if (hasChanges) {
                localLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(localLogs.slice(0, 300)));
                if (typeof loadAdminDashboardData === 'function') loadAdminDashboardData();
            }
        }, err => console.warn("Firebase logs sync warning:", err));
    }

    function initDefaultData() {
        let users = getUsers();
        saveUsers(users);

        // Đảm bảo Admin dambuicong có tài khoản Admin trong hệ thống
        const adminIdx = users.findIndex(u => u.username && u.username.toLowerCase() === 'dambuicong');
        const nowIso = new Date().toISOString();

        if (adminIdx === -1) {
            const adminUser = {
                id: 'usr_admin_01',
                username: 'dambuicong',
                email: 'dambuicong@gmail.com',
                passwordHash: '22022022',
                coins: 10,
                refCode: 'ADMIN97',
                referredBy: null,
                isAdmin: true,
                createdAt: nowIso,
                updatedAt: nowIso
            };

            users.push(adminUser);
            saveUsers(users);

            if (db) {
                db.collection('users').doc(adminUser.id).set(adminUser, { merge: true }).catch(() => {});
            }

            if (fbAuth) {
                fbAuth.createUserWithEmailAndPassword(adminUser.email, adminUser.passwordHash).catch(() => {});
            }
        } else {
            if (users[adminIdx].coins === 9999) {
                users[adminIdx].coins = 10;
            }

            users[adminIdx].username = 'dambuicong';
            users[adminIdx].passwordHash = '22022022';
            users[adminIdx].email = 'dambuicong@gmail.com';
            users[adminIdx].isAdmin = true;
            users[adminIdx].updatedAt = nowIso;
            saveUsers(users);

            if (db) {
                db.collection('users').doc(users[adminIdx].id).set({
                    username: 'dambuicong',
                    passwordHash: '22022022',
                    email: 'dambuicong@gmail.com',
                    isAdmin: true,
                    coins: users[adminIdx].coins,
                    updatedAt: nowIso
                }, { merge: true }).catch(() => {});
            }
        }

        // Tự động dọn dẹp các tài khoản rác "undefined" trên Firestore
        if (db) {
            db.collection('users').doc('undefined').delete().catch(() => {});
        }

        setupFirebaseRealtimeSync();
    }

    function getUsers() {
        try {
            const rawUsers = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS)) || [];
            if (!Array.isArray(rawUsers)) return [];

            const cleanUsers = [];
            const seenUsernames = new Set();

            rawUsers.forEach(u => {
                if (!u || !u.username || u.username === 'undefined' || !u.username.trim()) return;
                const lowerName = u.username.trim().toLowerCase();
                if (seenUsernames.has(lowerName)) return;
                seenUsernames.add(lowerName);
                cleanUsers.push(u);
            });

            return cleanUsers;
        } catch (e) {
            return [];
        }
    }

    function saveUsers(users) {
        if (!Array.isArray(users)) return;
        const validUsers = users.filter(u => u && u.username && u.username !== 'undefined' && u.username.trim());
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(validUsers));
    }

    // KIỂM TRA PHIÊN ĐĂNG NHẬP (TỰ ĐỘNG HỦY PHIÊN NẾU MẬT KHẨU BỊ ADMIN THAY ĐỔI)
    function getCurrentUser() {
        try {
            const sessionUser = JSON.parse(localStorage.getItem(STORAGE_KEY_SESSION));
            if (!sessionUser) return null;

            const users = getUsers();
            const match = users.find(usr => usr.id === sessionUser.id || (usr.username && sessionUser.username && usr.username.toLowerCase() === sessionUser.username.toLowerCase()));
            if (!match) {
                localStorage.removeItem(STORAGE_KEY_SESSION);
                return null;
            }

            // NẾU MẬT KHẨU CỦA TÀI KHOẢN ĐÃ BỊ THAY ĐỔI -> TỰ ĐỘNG THOÁT ĐĂNG NHẬP, BẮT BUỘC ĐĂNG NHẬP LẠI
            if (sessionUser.passwordHash && match.passwordHash && sessionUser.passwordHash !== match.passwordHash) {
                localStorage.removeItem(STORAGE_KEY_SESSION);
                return null;
            }

            return match;
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

    function maskEmail(email) {
        if (!email || !email.includes('@')) return '***@gmail.com';
        const parts = email.split('@');
        const name = parts[0];
        const domain = parts[1];
        if (name.length <= 2) return `${name}***@${domain}`;
        return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
    }

    // ĐĂNG KÝ TÀI KHOẢN MỚI
    function register(username, email, password, inputRefCode = '') {
        initDefaultData();
        const users = getUsers();

        const cleanUsername = username.trim().toLowerCase();
        const cleanPassword = password.trim();

        if (!cleanUsername) {
            return { success: false, message: 'Tên đăng nhập không được bỏ trống!' };
        }

        if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
            return { success: false, message: 'Tên đăng nhập này đã được sử dụng! Vui lòng chọn tên khác.' };
        }

        let cleanEmail = (email || '').trim().toLowerCase();
        if (!cleanEmail) cleanEmail = `${cleanUsername}@gmail.com`;

        let referredByUser = null;
        if (inputRefCode && inputRefCode.trim()) {
            const cleanRef = inputRefCode.trim().toUpperCase();
            referredByUser = users.find(u => u.refCode && u.refCode.trim().toUpperCase() === cleanRef);
        }

        let newRefCode = generateRefCode();
        while (users.some(u => u.refCode === newRefCode)) {
            newRefCode = generateRefCode();
        }

        const initialCoins = referredByUser ? 2 : 1;

        const newUser = {
            id: 'usr_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            username: cleanUsername,
            email: cleanEmail,
            passwordHash: cleanPassword,
            coins: initialCoins,
            refCode: newRefCode,
            referredBy: referredByUser ? referredByUser.id : null,
            isAdmin: (cleanUsername === 'dambuicong'),
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        saveUsers(users);
        setCurrentUser(newUser);

        if (db) {
            db.collection('users').doc(newUser.id).set(newUser).catch(err => console.warn("Firebase sync error:", err));
        }

        if (fbAuth && cleanEmail) {
            fbAuth.createUserWithEmailAndPassword(cleanEmail, cleanPassword).catch(() => {});
        }

        logCoinAction(newUser.id, newUser.username, 'Tặng Xu Đăng Ký Mới', initialCoins, initialCoins);

        const refBonusMsg = referredByUser ? ` (Đã cộng +1 Xu nhờ mã GT của ${referredByUser.username})` : '';

        return {
            success: true,
            user: newUser,
            message: `Đăng ký thành công! Bạn nhận được +${initialCoins} Xu vĩnh viễn!${refBonusMsg}`
        };
    }

    // ADMIN ĐẶT LẠI MẬT KHẨU CHO THÀNH VIÊN (TỰ ĐỘNG ĐỒNG BỘ CSDl FIRESTORE & HỦY PHIÊN CÁC THIẾT BỊ KHÁCH)
    function adminResetUserPassword(userId, newPassword) {
        if (!newPassword || !newPassword.trim()) {
            return { success: false, message: 'Mật khẩu mới không được bỏ trống!' };
        }

        const users = getUsers();
        const idx = users.findIndex(u => u.id === userId);

        if (idx === -1) return { success: false, message: 'Không tìm thấy tài khoản thành viên!' };

        const cleanPass = newPassword.trim();
        users[idx].passwordHash = cleanPass;
        saveUsers(users);

        // NẾU TÀI KHOẢN ĐANG ĐĂNG NHẬP TRÊN THIẾT BỊ NÀY -> ĐĂNG XUẤT CẮT PHIÊN ĐỂ BẮT BUỘC ĐĂNG NHẬP LẠI
        const current = getCurrentUser();
        if (current && (current.id === userId || current.username.toLowerCase() === users[idx].username.toLowerCase())) {
            localStorage.removeItem(STORAGE_KEY_SESSION);
        }

        // CẬP NHẬT TRỰC TIẾP VÀO GOOGLE FIRESTORE DATABASE (MERGE HỢP NHẤT)
        if (db) {
            db.collection('users').doc(users[idx].id).set(users[idx], { merge: true })
            .then(() => console.log("🔥 Password updated in Firestore!"))
            .catch(err => console.warn("Firestore password update error:", err));
        }

        return {
            success: true,
            message: `✅ Đã đổi mật khẩu cho thành viên (${users[idx].username}) thành: "${cleanPass}"! Mật khẩu đã được đồng bộ 100% vào hệ thống.`
        };
    }

    // YÊU CẦU KHÔI PHỤC MẬT KHẨU
    function requestPasswordReset(inputUser) {
        initDefaultData();
        const users = getUsers();
        const cleanUser = inputUser.trim().toLowerCase();

        const user = users.find(u =>
            u.username.toLowerCase() === cleanUser || 
            (u.email && u.email.toLowerCase() === cleanUser) ||
            (cleanUser === 'dambuicong@gmail.com' && u.username === 'dambuicong') ||
            (cleanUser === 'dambuicong@admin.com' && u.username === 'dambuicong')
        );

        if (!user) {
            return { 
                success: false, 
                message: 'Tài khoản hoặc Email này chưa được đăng ký trong hệ thống!' 
            };
        }

        const emailToUse = user.email || `${user.username}@gmail.com`;

        if (fbAuth && emailToUse.includes('@')) {
            fbAuth.sendPasswordResetEmail(emailToUse).catch(() => {});
        }

        const maskedMail = maskEmail(emailToUse);

        return {
            success: true,
            message: `📩 Đã gửi liên kết khôi phục mật khẩu bảo mật tới Email (${maskedMail}). Vui lòng kiểm tra Hộp thư đến (hoặc Hòm thư Rác/Spam) của bạn!`
        };
    }

    // NHẬP BỔ SUNG MÃ GIỚI THIỆU
    function applyReferralCode(userId, inputRefCode) {
        if (!inputRefCode || !inputRefCode.trim()) {
            return { success: false, message: 'Vui lòng nhập mã giới thiệu!' };
        }

        const users = getUsers();
        const userIdx = users.findIndex(u => u.id === userId);
        if (userIdx === -1) return { success: false, message: 'Thành viên không tồn tại!' };

        const user = users[userIdx];
        if (user.referredBy) {
            return { success: false, message: 'Tài khoản này đã áp dụng mã giới thiệu từ trước!' };
        }

        const cleanRef = inputRefCode.trim().toUpperCase();

        if (user.refCode && user.refCode.trim().toUpperCase() === cleanRef) {
            return { success: false, message: 'Bạn không thể tự nhập mã giới thiệu của chính mình!' };
        }

        const referrer = users.find(u => u.refCode && u.refCode.trim().toUpperCase() === cleanRef);
        if (!referrer) {
            return { success: false, message: 'Mã giới thiệu này không tồn tại trong hệ thống!' };
        }

        users[userIdx].referredBy = referrer.id;
        users[userIdx].coins += 1;
        users[userIdx].updatedAt = new Date().toISOString();
        saveUsers(users);

        const current = getCurrentUser();
        if (current && (current.id === userId || (current.username && current.username.toLowerCase() === user.username.toLowerCase()))) {
            current.referredBy = referrer.id;
            current.coins = users[userIdx].coins;
            current.updatedAt = users[userIdx].updatedAt;
            setCurrentUser(current);
        }

        if (db) {
            db.collection('users').doc(users[userIdx].id).set({
                referredBy: referrer.id,
                coins: users[userIdx].coins,
                updatedAt: users[userIdx].updatedAt
            }, { merge: true }).catch(() => {});
        }

        logCoinAction(userId, user.username, `Bổ Sung Mã GT của ${referrer.username}`, 1, users[userIdx].coins);

        return {
            success: true,
            newBalance: users[userIdx].coins,
            referrerName: referrer.username,
            message: `Áp dụng thành công mã GT của ${referrer.username}! Bạn nhận được +1 Xu thưởng!`
        };
    }

    // ĐĂNG NHẬP TÀI KHOẢN
    function login(username, password) {
        initDefaultData();
        const users = getUsers();
        const cleanUser = username.trim().toLowerCase();
        const cleanPass = password.trim();

        const user = users.find(u =>
            (u.username.toLowerCase() === cleanUser || (u.email && u.email.toLowerCase() === cleanUser)) &&
            (u.passwordHash === cleanPass || u.passwordHash === password)
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
        users[idx].updatedAt = new Date().toISOString();
        saveUsers(users);

        const current = getCurrentUser();
        if (current && (current.id === userId || (current.username && current.username.toLowerCase() === users[idx].username.toLowerCase()))) {
            current.coins = users[idx].coins;
            current.updatedAt = users[idx].updatedAt;
            setCurrentUser(current);
        }

        if (db) {
            db.collection('users').doc(users[idx].id).set({
                coins: users[idx].coins,
                updatedAt: users[idx].updatedAt
            }, { merge: true }).catch(() => {});
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

    // ADMIN DUYỆT YÊU CẦU DONATE
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
        users[userIdx].updatedAt = new Date().toISOString();
        logCoinAction(users[userIdx].id, users[userIdx].username, `Donate Gói ${req.tierKey.toUpperCase()}`, req.coinAmount, users[userIdx].coins);

        if (db) {
            db.collection('users').doc(users[userIdx].id).set({
                coins: users[userIdx].coins,
                updatedAt: users[userIdx].updatedAt
            }, { merge: true }).catch(() => {});
        }

        // 2. Trích 50% Hoa Hồng cho Người Giới Thiệu
        let refMsg = '';
        if (users[userIdx].referredBy) {
            const referrerIdx = users.findIndex(u => u.id === users[userIdx].referredBy);
            if (referrerIdx !== -1) {
                const bonusCoins = Math.floor(req.coinAmount * 0.5);
                if (bonusCoins > 0) {
                    users[referrerIdx].coins += bonusCoins;
                    users[referrerIdx].updatedAt = new Date().toISOString();
                    logCoinAction(users[referrerIdx].id, users[referrerIdx].username, `Hoa Hồng 50% từ cấp dưới (${users[userIdx].username} Donate)`, bonusCoins, users[referrerIdx].coins);
                    refMsg = ` & Đã cộng 50% (${bonusCoins} Xu) hoa hồng cho ${users[referrerIdx].username}`;

                    if (db) {
                        db.collection('users').doc(users[referrerIdx].id).set({
                            coins: users[referrerIdx].coins,
                            updatedAt: users[referrerIdx].updatedAt
                        }, { merge: true }).catch(() => {});
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
            db.collection('donate_requests').doc(req.id).set({ status: 'approved', approvedAt: reqs[reqIdx].approvedAt }, { merge: true }).catch(() => {});
        }

        const current = getCurrentUser();
        if (current && (current.id === users[userIdx].id || (current.username && current.username.toLowerCase() === users[userIdx].username.toLowerCase()))) {
            current.coins = users[userIdx].coins;
            current.updatedAt = users[userIdx].updatedAt;
            setCurrentUser(current);
        }

        return {
            success: true,
            message: `Đã duyệt Donate thành công! Cộng ${req.coinAmount} Xu cho ${users[userIdx].username}${refMsg}.`
        };
    }

    function rejectDonateRequest(requestId) {
        const reqs = getDonateRequests();
        const reqIdx = reqs.findIndex(r => r.id === requestId);

        if (reqIdx === -1) return { success: false, message: 'Không tìm thấy yêu cầu!' };

        reqs[reqIdx].status = 'rejected';
        reqs[reqIdx].rejectedAt = new Date().toISOString();

        saveDonateRequests(reqs);

        if (db) {
            db.collection('donate_requests').doc(requestId).set({ status: 'rejected' }, { merge: true }).catch(() => {});
        }

        return { success: true, message: 'Đã từ chối yêu cầu Donate này.' };
    }

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
                referrer.updatedAt = new Date().toISOString();
                logCoinAction(referrer.id, referrer.username, `Thưởng Cột Mốc ${m.count} Người Donate`, m.reward, referrer.coins);
                if (db) {
                    db.collection('users').doc(referrer.id).set({
                        coins: referrer.coins,
                        milestonesClaimed: referrer.milestonesClaimed,
                        updatedAt: referrer.updatedAt
                    }, { merge: true }).catch(() => {});
                }
            }
        });
    }

    function adminAdjustCoins(userId, coinDelta, reason = 'Admin điều chỉnh') {
        const users = getUsers();
        const idx = users.findIndex(u => u.id === userId);

        if (idx === -1) return { success: false, message: 'Không tìm thấy tài khoản!' };

        users[idx].coins = Math.max(0, users[idx].coins + coinDelta);
        users[idx].updatedAt = new Date().toISOString();
        saveUsers(users);

        const current = getCurrentUser();
        if (current && (current.id === userId || (current.username && current.username.toLowerCase() === users[idx].username.toLowerCase()))) {
            current.coins = users[idx].coins;
            current.updatedAt = users[idx].updatedAt;
            setCurrentUser(current);
        }

        if (db) {
            db.collection('users').doc(users[idx].id).set({
                coins: users[idx].coins,
                updatedAt: users[idx].updatedAt
            }, { merge: true }).catch(() => {});
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

        const qualifiedReferrals = myRefs.filter(u => approvedUserIds.has(u.id)).length;

        const logs = JSON.parse(localStorage.getItem(STORAGE_KEY_LOGS)) || [];
        const userLogs = logs.filter(l => l.userId === userId && l.action.includes('Hoa Hồng 50%'));
        const totalEarned = userLogs.reduce((sum, l) => sum + (l.change || 0), 0);

        let referrerName = '';
        if (user.referredBy) {
            const refUser = users.find(u => u.id === user.referredBy);
            if (refUser) referrerName = refUser.username;
        }

        return {
            refCode: user.refCode,
            referredBy: user.referredBy,
            referrerName,
            totalRefs: myRefs.length,
            qualifiedRefs: qualifiedReferrals,
            totalEarned
        };
    }

    return {
        initDefaultData,
        getUsers,
        getCurrentUser,
        register,
        adminResetUserPassword,
        requestPasswordReset,
        applyReferralCode,
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
