var express = require('express');
let slugify = require('slugify')
var router = express.Router();
let modelProduct = require('../schemas/products')
let { checkLogin, checkRole } = require('../utils/authHandler.js')

// ============================================================
// PHÂN QUYỀN PRODUCTS:
//   GET /        -> tất cả mọi người (không cần đăng nhập)
//   GET /:id     -> tất cả mọi người (không cần đăng nhập)
//   POST /       -> chỉ ADMIN hoặc MODERATOR
//   PUT /:id     -> chỉ ADMIN hoặc MODERATOR
//   DELETE /:id  -> chỉ ADMIN
// ============================================================

// ✅ GET all products - CÔNG KHAI, không cần login
router.get('/', async function (req, res, next) {
  let data = await modelProduct.find({});
  let queries = req.query;
  let titleQ = queries.title ? queries.title : '';
  let maxPrice = queries.maxPrice ? queries.maxPrice : 1E4;
  let minPrice = queries.minPrice ? queries.minPrice : 0;
  let limit = queries.limit ? parseInt(queries.limit) : 5;
  let page = queries.page ? parseInt(queries.page) : 1;
  let result = data.filter(
    function (e) {
      return (!e.isDeleted) && e.price >= minPrice
        && e.price <= maxPrice && e.title.toLowerCase().includes(titleQ);
    }
  )
  result = result.splice(limit * (page - 1), limit)
  res.send(result);
});

// ✅ GET product by id - CÔNG KHAI, không cần login
router.get('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    let result = await modelProduct.findById(id)
    if (result && (!result.isDeleted)) {
      res.send(result)
    } else {
      res.status(404).send({ message: "ID not found" })
    }
  } catch (error) {
    res.status(404).send({ message: "ID not found" })
  }
})

// ✅ POST create product - chỉ ADMIN hoặc MODERATOR
router.post('/', checkLogin, checkRole("ADMIN", "MODERATOR"), async function (req, res, next) {
  try {
    // Tạo slug từ title
    let baseSlug = slugify(req.body.title, {
      replacement: '-', remove: undefined,
      locale: 'vi', trim: true
    })
    // Thêm timestamp để tránh trùng slug nếu cùng tên sản phẩm
    let finalSlug = baseSlug + '-' + Date.now()

    let newObj = new modelProduct({
      title: req.body.title,
      slug: finalSlug,
      price: req.body.price,
      description: req.body.description,
      category: req.body.category,
      images: req.body.images
    })
    await newObj.save();
    res.send(newObj)
  } catch (error) {
    // Lỗi duplicate key (E11000) hoặc validation
    if (error.code === 11000) {
      return res.status(400).send({ message: "Sản phẩm bị trùng slug, vui lòng đổi tên!" })
    }
    res.status(400).send({ message: error.message })
  }
})


// ✅ PUT update product - chỉ ADMIN hoặc MODERATOR
router.put('/:id', checkLogin, checkRole("ADMIN", "MODERATOR"), async function (req, res, next) {
  try {
    let id = req.params.id;
    let result = await modelProduct.findByIdAndUpdate(
      id, req.body, { new: true }
    )
    if (!result) return res.status(404).send({ message: "ID not found" })
    res.send(result);
  } catch (error) {
    res.status(404).send({ message: "ID not found" })
  }
})

// ✅ DELETE product - chỉ ADMIN
router.delete('/:id', checkLogin, checkRole("ADMIN"), async function (req, res, next) {
  try {
    let id = req.params.id;
    let result = await modelProduct.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    )
    if (!result) return res.status(404).send({ message: "ID not found" })
    res.send(result);
  } catch (error) {
    res.status(404).send({ message: "ID not found" })
  }
})

module.exports = router;
