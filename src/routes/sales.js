const express = require("express");
const router = express.Router();

const salesController = require("../controllers/salesController");
const { requireAuth } = require("../middleware/auth");

router.get("/list", requireAuth, salesController.list);
router.get("/get/:id", requireAuth, salesController.retrieve);
router.get("/get-by-dni/:id", requireAuth, salesController.getByDni);
router.patch("/update/:id", requireAuth, salesController.partialUpdate);
router.delete("/delete/:id", requireAuth, salesController.delete);
router.post("/create", requireAuth, salesController.create);

module.exports = router;
