const { validateInventoryInput } = require("../utils/inventory");
const inventoryService = require("../services/inventoryService");

class InventoryController {
  /**
   * Registro de nuevo usuario
   * GET /api/inventory/list
   */
  async list(req, res) {
    const userId = req.user.id;
    const inventory = await inventoryService.findAll(userId);
    res.status(200).json(inventory);
  }

  /**
   * Registro de nuevo usuario
   * GET /api/inventory/get/:id
   */
  async retrieve(req, res) {
    const userId = req.user.id;
    const itemId = req.params.id;

    try {
      const result = await inventoryService.getInventory(userId, itemId);
      res.status(200).json(result);
    } catch (err) {
      console.log(err);
      res.status(404).json({ error: "Not found" });
    }
  }

  /**
   * Registro de nuevo usuario
   * PATCH /api/inventory/update/:id
   */
  async partialUpdate(req, res) {
    const userId = req.user.id;
    const itemId = req.params.id;

    try {
      const result = await inventoryService.partialUpdate(itemId, req.body);
      res.status(200).json(result);
    } catch (err) {
      console.log(err);
      res.status(404).json({ error: "Not found" });
    }
  }

  /**
   * Registro de nuevo usuario
   * DELETE /api/inventory/delete/:id
   */
  async delete(req, res) {
    const userId = req.user.id;
    const itemId = req.params.id;
    try {
      const deleted = await inventoryService.deleteInventory(userId, itemId);
      if (!deleted) {
        return res
          .status(404)
          .json({ error: "Item not found or unauthorized" });
      }

      res.status(200).json({ message: "Item deleted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  /**
   * Registro de nuevo usuario
   * POST /api/inventory/create
   */
  async create(req, res) {
    const { name, price, quantity, category } = req.body;
    const error = validateInventoryInput(req.body);
    const userId = req.user.id;

    if (error) {
      return res.status(400).json({ error });
    }

    try {
      const item = await inventoryService.addInventoryItem({
        name,
        price,
        quantity,
        category,
        userId,
      });

      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = new InventoryController();
