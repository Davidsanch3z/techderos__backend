const express = require("express");
const router = express.Router();

const providerController = require("../controllers/providerController");
const { requireAuth } = require("../middleware/auth");

router.get("/list", requireAuth, providerController.list);
router.get("/get/:id", requireAuth, providerController.retrieve);
router.patch("/update/:id", requireAuth, providerController.partialUpdate);
router.delete("/delete/:id", requireAuth, providerController.delete);
router.post("/create", requireAuth, providerController.create);

module.exports = router;
