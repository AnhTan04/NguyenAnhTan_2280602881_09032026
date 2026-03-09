let userModel = require('../schemas/users')
let bcrypt = require('bcrypt')

module.exports = {
    CreateAnUser: async function (username, password, email, role,
        avatarUrl, fullName, status, loginCount
    ) {
        let newUser = new userModel({
            username: username,
            password: password,
            email: email,
            role: role,
            avatarUrl: avatarUrl,
            fullName: fullName,
            status: status,
            loginCount: loginCount
        })
        await newUser.save();
        return newUser;
    },

    // ✅ So sánh password nhập vào với password đã hash trong DB
    QueryByUserNameAndPassword: async function (username, password) {
        let getUser = await userModel.findOne({ username: username, isDeleted: false });
        if (!getUser) {
            return false;
        }
        // So sánh password nhập vào (plain text) với hash trong DB
        let isMatch = bcrypt.compareSync(password, getUser.password);
        if (!isMatch) {
            return false;
        }
        return getUser;
    },

    FindUserById: async function (id) {
        return await userModel.findOne({
            _id: id,
            isDeleted: false
        }).populate('role')
    },

    // ✅ Đổi mật khẩu: kiểm tra oldPassword -> cập nhật newPassword
    ChangePassword: async function (userId, oldPassword, newPassword) {
        // Tìm user theo id
        let user = await userModel.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return { success: false, message: "Không tìm thấy người dùng" };
        }

        // So sánh mật khẩu cũ
        let isMatch = bcrypt.compareSync(oldPassword, user.password);
        if (!isMatch) {
            return { success: false, message: "Mật khẩu cũ không đúng" };
        }

        // Hash mật khẩu mới và lưu
        // Vì schema có pre('save') tự hash -> chỉ cần gán plain text rồi save
        user.password = newPassword;
        await user.save();

        return { success: true, message: "Đổi mật khẩu thành công" };
    }
}