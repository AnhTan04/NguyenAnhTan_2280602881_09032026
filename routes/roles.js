var express = require("express");
var router = express.Router();
let roleModel = require("../schemas/roles");
let { checkLogin, checkRole } = require('../utils/authHandler.js')

// ============================================================
// PHÂN QUYỀN ROLES:
//   GET /        -> ADMIN + MODERATOR (đọc tất cả)
//   GET /:id     -> ADMIN + MODERATOR (đọc tất cả)
//   POST /       -> chỉ ADMIN
//   PUT /:id     -> chỉ ADMIN
//   DELETE /:id  -> chỉ ADMIN
// ============================================================

// ✅ GET all roles - ADMIN và MODERATOR
router.get("/", checkLogin, checkRole("ADMIN", "MODERATOR"), async function (req, res, next) {
    let roles = await roleModel.find({ isDeleted: false });
    res.send(roles);
});

// ✅ GET role by id - ADMIN và MODERATOR
router.get("/:id", checkLogin, checkRole("ADMIN", "MODERATOR"), async function (req, res, next) {
    try {
        let result = await roleModel.find({ _id: req.params.id, isDeleted: false });
        if (result.length > 0) {
            res.send(result);
        } else {
            res.status(404).send({ message: "id not found" });
        }
    } catch (error) {
        res.status(404).send({ message: "id not found" });
    }
});

// ✅ POST create role - chỉ ADMIN
router.post("/", checkLogin, checkRole("ADMIN"), async function (req, res, next) {
    try {
        let newItem = new roleModel({
            name: req.body.name,
            description: req.body.description
        });
        await newItem.save();
        res.send(newItem);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// ✅ PUT update role - chỉ ADMIN
router.put("/:id", checkLogin, checkRole("ADMIN"), async function (req, res, next) {
    try {
        let id = req.params.id;
        let updatedItem = await roleModel.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedItem) {
            return res.status(404).send({ message: "id not found" });
        }
        res.send(updatedItem);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// ✅ DELETE role - chỉ ADMIN
router.delete("/:id", checkLogin, checkRole("ADMIN"), async function (req, res, next) {
    try {
        let id = req.params.id;
        let updatedItem = await roleModel.findByIdAndUpdate(
            id,
            { isDeleted: true },
            { new: true }
        );
        if (!updatedItem) {
            return res.status(404).send({ message: "id not found" });
        }
        res.send(updatedItem);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

module.exports = router;