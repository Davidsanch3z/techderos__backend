const express = require("express");
const router = express.Router();

const qrController = require("../controllers/qrController");
const { requireAuth } = require("../middleware/auth");

router.get("/list", requireAuth, qrController.list);
router.get("/get/:id", requireAuth, qrController.retrieve);
router.post("/create", requireAuth, qrController.create);
router.delete("/delete/:id", requireAuth, qrController.delete);

module.exports = router;
