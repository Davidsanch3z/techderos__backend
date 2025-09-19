const express = require("express");
const router = express.Router();

const orderController = require("../controllers/orderController");
const { requireAuth } = require("../middleware/auth");

router.get("/list", requireAuth, orderController.list);
router.get("/get/:id", requireAuth, orderController.retrieve);
router.post("/create", requireAuth, orderController.create);
router.delete("/delete/:id", requireAuth, orderController.delete);
router.patch("/update/:id", requireAuth, orderController.partialUpdate);

module.exports = router;
