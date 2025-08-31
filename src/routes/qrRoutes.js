const express = require("express");
const router = express.Router();

const qrController = require("../controllers/qrController");
const { requireAuth } = require("../middleware/auth");

router.get("/get/:id", requireAuth, qrController.retrieve);
// router.delete("/delete/:id", requireAuth, objectsController.delete);
// router.post("/create", requireAuth, objectsController.create);

module.exports = router;
