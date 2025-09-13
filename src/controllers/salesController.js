const saleService = require("../services/saleService");
const { validateSalesInput } = require("../utils/sales");

class salesController {
  /**
   * Returns a list of sales items for the authenticated user
   * GET /api/sales/list
   */
  async list(req, res) {
    try {
      const userId = req.user.id;
      const sales = await saleService.getSalesFromUser(userId);
      res.status(200).json(sales);
    } catch (error) {
      res.status(500).json({ error });
    }
  }

  /**
   * Retrieve a specific sale item by ID for the authenticated user
   * GET /api/sales/get/:id
   */
  async retrieve(req, res) {
    const userId = req.user.id;
    const itemId = req.params.id;

    try {
      const result = await saleService.findByUserIdAndItemId(userId, itemId);

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
   * Creates a new sales record for the authenticated user
   * POST /api/sales/create
   */
  async create(req, res) {
    const {
      date,
      customer,
      customerEmail,
      products,
      paymentMethod,
      total,
      amount,
      address,
      dni,
    } = req.body;

    const userId = req.user.id;
    const error = validateSalesInput(req.body);

    if (error) {
      return res.status(400).json({ error });
    }

    try {
      const sale = await saleService.create({
        date,
        customer,
        customerEmail,
        products,
        paymentMethod,
        total,
        userId,
        amount,
        address,
        dni,
      });
      res.status(201).json(sale);
    } catch (error) {
      res.status(500).json({ error });
    }
  }

  /**
   * Partially update an sales item by ID for the authenticated user
   * PATCH /api/sales/update/:id
   */
  async partialUpdate(req, res) {
    const userId = req.user.id;
    const itemId = req.params.id;
    try {
      const check = await saleService.findByUserIdAndItemId(userId, itemId);
      if (!check) {
        res.status(404).json({ error: "Not found" });
        return;
      }

      const result = await saleService.partialUpdate(itemId, userId, req.body);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error });
    }
  }

  async getByDni(req, res) {
    try {
      const itemId = req.params.id;
      const result = await saleService.findByUserDni(itemId);
      if (!result) {
        res.status(404).json({ error: "Not found" });
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error });
    }
  }

  /**
   * Delete an sales item by ID for the authenticated user
   * DELETE /api/inventory/delete/:id
   */
  async delete(req, res) {
    const userId = req.user.id;
    const itemId = req.params.id;
    try {
      const check = await saleService.findByUserIdAndItemId(userId, itemId);
      if (!check) {
        res.status(404).json({ error: "Not found" });
        return;
      }

      await saleService.deleteInventory(userId, itemId);
      res.status(200).json({ message: "Item deleted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = new salesController();
