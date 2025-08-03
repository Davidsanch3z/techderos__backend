const express = require("express");
const router = express.Router();

const inventoryController = require("../controllers/inventoryController");
const { requireAuth } = require("../middleware/auth");

router.get("/list", requireAuth, inventoryController.list);
router.get("/get/:id", requireAuth, inventoryController.retrieve);
router.patch("/update/:id", requireAuth, inventoryController.partialUpdate);
router.delete("/delete/:id", requireAuth, inventoryController.delete);
router.post("/create", requireAuth, inventoryController.create);

module.exports = router;
