var express = require('express');
var router = express.Router();
let userController = require('../controllers/users');
let jwt = require('jsonwebtoken')
let { checkLogin } = require('../utils/authHandler.js')

// ============================================================
// AUTH ROUTES
// ============================================================

// ✅ ĐĂNG KÝ - POST /api/v1/auth/register
router.post('/register', async function (req, res, next) {
    let newUser = await userController.CreateAnUser(
        req.body.username,
        req.body.password,
        req.body.email,
        "69a5462f086d74c9e772b804"   // role mặc định (user thường)
    )
    res.send({
        message: "Đăng ký thành công",
        data: { username: newUser.username, email: newUser.email }
    })
});

// ✅ ĐĂNG NHẬP - POST /api/v1/auth/login
router.post('/login', async function (req, res, next) {
    let result = await userController.QueryByUserNameAndPassword(
        req.body.username, req.body.password
    )
    if (result) {
        let token = jwt.sign({
            id: result.id
        }, 'secret', {
            expiresIn: '1h'
        })
        // Lưu vào cookie
        res.cookie("token", token, {
            maxAge: 60 * 60 * 1000,
            httpOnly: true
        });
        res.send({
            message: "Đăng nhập thành công",
            token: token          // trả ra token để dùng trong Postman (Bearer)
        })
    } else {
        res.status(401).send({ message: "Sai tên đăng nhập hoặc mật khẩu" })
    }
});

// ✅ XEM THÔNG TIN BẢN THÂN - GET /api/v1/auth/me
// Yêu cầu: phải đăng nhập (checkLogin)
router.get('/me', checkLogin, async function (req, res, next) {
    let getUser = await userController.FindUserById(req.userId);
    res.send(getUser);
})

// ✅ ĐĂNG XUẤT - POST /api/v1/auth/logout
// Yêu cầu: phải đăng nhập (checkLogin)
router.post('/logout', checkLogin, function (req, res, next) {
    res.cookie('token', null, {
        maxAge: 0,
        httpOnly: true
    })
    res.send({ message: "Đăng xuất thành công" })
})

// ✅ ĐỔI MẬT KHẨU - POST /api/v1/auth/change-password
// Yêu cầu: phải đăng nhập (checkLogin)
// Body: { "oldPassword": "...", "newPassword": "..." }
router.post('/change-password', checkLogin, async function (req, res, next) {
    let { oldPassword, newPassword } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!oldPassword || !newPassword) {
        return res.status(400).send({ message: "Vui lòng cung cấp oldPassword và newPassword" });
    }
    if (newPassword.length < 6) {
        return res.status(400).send({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
    }

    // Gọi hàm ChangePassword từ controller
    let result = await userController.ChangePassword(req.userId, oldPassword, newPassword);

    if (result.success) {
        res.send({ message: result.message });
    } else {
        res.status(400).send({ message: result.message });
    }
})

module.exports = router;
