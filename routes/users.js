var express = require("express");
var router = express.Router();
let { postUserValidator, validateResult } = require('../utils/validatorHandler')
let userController = require('../controllers/users')
let { checkLogin, checkRole } = require('../utils/authHandler.js')
let userModel = require("../schemas/users");

// ============================================================
// PHÂN QUYỀN USERS:
//   GET /        -> ADMIN + MODERATOR
//   GET /:id     -> ADMIN + MODERATOR
//   POST /       -> chỉ ADMIN
//   PUT /:id     -> chỉ ADMIN
//   DELETE /:id  -> chỉ ADMIN
// ============================================================

// ✅ GET all users - ADMIN và MODERATOR
router.get("/", checkLogin, checkRole("ADMIN", "MODERATOR"), async function (req, res, next) {
  let users = await userModel
    .find({ isDeleted: false })
    .populate({ 'path': 'role', 'select': "name" })
  res.send(users);
});

// ✅ GET user by id - ADMIN và MODERATOR
router.get("/:id", checkLogin, checkRole("ADMIN", "MODERATOR"), async function (req, res, next) {
  try {
    let result = await userModel
      .find({ _id: req.params.id, isDeleted: false })
    if (result.length > 0) {
      res.send(result);
    } else {
      res.status(404).send({ message: "id not found" });
    }
  } catch (error) {
    res.status(404).send({ message: "id not found" });
  }
});

// ✅ POST create user - chỉ ADMIN
router.post("/", checkLogin, checkRole("ADMIN"), postUserValidator, validateResult,
  async function (req, res, next) {
    try {
      let newItem = await userController.CreateAnUser(
        req.body.username,
        req.body.password,
        req.body.email,
        req.body.role
      )
      let saved = await userModel.findById(newItem._id)
      res.send(saved);
    } catch (err) {
      res.status(400).send({ message: err.message });
    }
  });

// ✅ PUT update user - chỉ ADMIN
router.put("/:id", checkLogin, checkRole("ADMIN"), async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await userModel.findById(id);
    if (!updatedItem) return res.status(404).send({ message: "id not found" });

    for (const key of Object.keys(req.body)) {
      updatedItem[key] = req.body[key];
    }
    await updatedItem.save();

    let populated = await userModel.findById(updatedItem._id)
    res.send(populated);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// ✅ DELETE user - chỉ ADMIN
router.delete("/:id", checkLogin, checkRole("ADMIN"), async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await userModel.findByIdAndUpdate(
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