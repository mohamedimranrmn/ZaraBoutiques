const express = require('express');
const productController = require("../controllers/Product");
const router = express.Router();

// STATIC ROUTES FIRST
router.patch("/undelete/:id", productController.undeleteById);
router.delete("/force/:id", productController.forceDeleteById);
router.get("/stock/:id", productController.getStockById);

// MAIN ROUTES
router.post("/", productController.create);
router.get("/", productController.getAll);

// DYNAMIC ROUTES LAST
router.get("/:id", productController.getById);
router.patch("/:id", productController.updateById);
router.delete("/:id", productController.deleteById);

module.exports = router;
