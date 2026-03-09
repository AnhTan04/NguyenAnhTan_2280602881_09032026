/**
 * SEED FILE - Chạy một lần để tạo dữ liệu ban đầu
 * Lệnh: node seed.js
 */
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

mongoose.connect('mongodb://localhost:27017/nnptud-c2');
mongoose.connection.on('connected', () => {
    console.log("✅ Kết nối MongoDB thành công");
    seedData();
});

// ─── SCHEMAS (copy nhanh) ──────────────────────────────────────
const roleSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });
const RoleModel = mongoose.model("role", roleSchema);

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    fullName: { type: String, default: "" },
    avatarUrl: { type: String, default: "https://i.sstatic.net/l60Hf.png" },
    status: { type: Boolean, default: true },
    role: { type: mongoose.Schema.Types.ObjectId, ref: "role", required: true },
    loginCount: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });
const UserModel = mongoose.model("user", userSchema);

// ─── HÀM SEED ──────────────────────────────────────────────────
async function seedData() {
    try {
        // 1. Tạo role ADMIN
        let adminRole = await RoleModel.findOne({ name: "ADMIN" });
        if (!adminRole) {
            adminRole = await RoleModel.create({
                name: "ADMIN",
                description: "Quản trị viên - full quyền"
            });
            console.log("✅ Đã tạo role ADMIN:", adminRole._id);
        } else {
            console.log("⚠️  Role ADMIN đã tồn tại:", adminRole._id);
        }

        // 2. Tạo role MODERATOR
        let modRole = await RoleModel.findOne({ name: "MODERATOR" });
        if (!modRole) {
            modRole = await RoleModel.create({
                name: "MODERATOR",
                description: "Kiểm duyệt viên - chỉ đọc"
            });
            console.log("✅ Đã tạo role MODERATOR:", modRole._id);
        } else {
            console.log("⚠️  Role MODERATOR đã tồn tại:", modRole._id);
        }

        // 3. Tạo user ADMIN (password được hash thủ công vì không qua pre-save)
        let existAdmin = await UserModel.findOne({ username: "admin01" });
        if (!existAdmin) {
            let salt = bcrypt.genSaltSync(10);
            let hashedPassword = bcrypt.hashSync("admin123", salt);
            let adminUser = await UserModel.create({
                username: "admin01",
                password: hashedPassword,
                email: "admin01@gmail.com",
                fullName: "Admin User",
                status: true,
                role: adminRole._id
            });
            console.log("✅ Đã tạo user ADMIN:", adminUser.username, "/ password: admin123");
        } else {
            console.log("⚠️  User admin01 đã tồn tại");
        }

        // 4. Tạo user MODERATOR
        let existMod = await UserModel.findOne({ username: "mod01" });
        if (!existMod) {
            let salt = bcrypt.genSaltSync(10);
            let hashedPassword = bcrypt.hashSync("mod123", salt);
            let modUser = await UserModel.create({
                username: "mod01",
                password: hashedPassword,
                email: "mod01@gmail.com",
                fullName: "Moderator User",
                status: true,
                role: modRole._id
            });
            console.log("✅ Đã tạo user MODERATOR:", modUser.username, "/ password: mod123");
        } else {
            console.log("⚠️  User mod01 đã tồn tại");
        }

        console.log("\n🎉 SEED HOÀN THÀNH!");
        console.log("─────────────────────────────────────");
        console.log("  Login ADMIN    : admin01 / admin123");
        console.log("  Login MODERATOR: mod01   / mod123");
        console.log("─────────────────────────────────────");
        console.log("\n👉 Bây giờ chạy lại: npm start");
        console.log("👉 Sau đó dùng Postman: POST /api/v1/auth/login");

    } catch (err) {
        console.error("❌ Lỗi seed:", err.message);
    } finally {
        mongoose.connection.close();
    }
}
