const express = require("express");
const router = express.Router();

const objectsController = require("../controllers/objectsController");
const { requireAuth } = require("../middleware/auth");

router.get("/get/:id", requireAuth, objectsController.retrieve);
router.delete("/delete/:id", requireAuth, objectsController.delete);
router.post("/create", requireAuth, objectsController.create);

module.exports = router;
