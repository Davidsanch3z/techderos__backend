const { validateInventoryInput } = require("../utils/inventory");
const inventoryService = require("../services/inventoryService");

class InventoryController {
  /**
   * Returns a list of inventory items for the authenticated user
   * GET /api/inventory/list
   */
  async list(req, res) {
    try {
      const userId = req.user.id;
      const inventory = await inventoryService.findAll(userId);
      res.status(200).json(inventory);
    } catch (err) {
      res.status(500).json(err);
    }
  }

  /**
   * Retrieve a specific inventory item by ID for the authenticated user
   * GET /api/inventory/get/:id
   */
  async retrieve(req, res) {
    const userId = req.user.id;
    const itemId = req.params.id;

    try {
      const result = await inventoryService.getInventory(userId, itemId);

      if (!result) {
        res.status(404).json({ error: "Not found" });
        return;
      }

      res.status(200).json(result);
    } catch (err) {
      console.log(err);
      res.status(404).json({ error: "Not found" });
    }
  }

  /**
   * Partially update an inventory item by ID for the authenticated user
   * PATCH /api/inventory/update/:id
   */
  async partialUpdate(req, res) {
    const userId = req.user.id;
    const itemId = req.params.id;

    try {
      const check = await inventoryService.getInventory(userId, itemId);
      if (!check) {
        res.status(404).json({ error: "Not found" });
        return;
      }

      const result = await inventoryService.partialUpdate(itemId, req.body);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error });
    }
  }

  /**
   * Delete an inventory item by ID for the authenticated user
   * DELETE /api/inventory/delete/:id
   */
  async delete(req, res) {
    const userId = req.user.id;
    const itemId = req.params.id;
    try {
      const check = await inventoryService.getInventory(userId, itemId);
      if (!check) {
        res.status(404).json({ error: "Not found" });
        return;
      }

      const deleted = await inventoryService.deleteInventory(userId, itemId);
      res.status(200).json({ message: "Item deleted successfully" });
    } catch (error) {
      res.status(500).json({ error });
    }
  }

  /**
   * Create a new inventory item for the authenticated user
   * POST /api/inventory/create
   */
  async create(req, res) {
    const error = validateInventoryInput(req.body);
    const userId = req.user.id;
    const {
      name,
      price,
      quantity,
      category,
      supplierName,
      presentation,
      expirationDate,
      profitMargin,
    } = req.body;

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
        supplierName,
        presentation,
        expirationDate,
        profitMargin,
      });

      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = new InventoryController();
