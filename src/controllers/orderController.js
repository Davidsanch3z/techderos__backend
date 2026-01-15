const { validateOrderInput } = require("../utils/orders");
const orderService = require("../services/orderService");

class orderController {
  /**
   * List an orders for the current user
   * GET /api/orders/list/:id
   */
  async list(req, res) {
    try {
      const userId = req.user.id;
      const orders = await orderService.findByUserId(userId);
      res.status(200).json(orders);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Retrieve an order by ID for the current user
   * GET /api/orders/get/:id
   */
  async retrieve(req, res) {
    const itemId = req.params.id;
    try {
      const result = await orderService.findById(itemId);
      if (!result) {
        return res.status(404).json({ message: "Object not found" });
      }
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error });
    }
  }

  /**
   * Create a new order record
   * POST /api/orders/create/
   */
  async create(req, res) {
    const error = validateOrderInput(req.body);
    const userId = req.user.id;
    const { product, supplier, quantity, date, status } = req.body;

    if (error) {
      return res.status(400).json({ error });
    }

    try {
      const item = await orderService.create(
        {
          product,
          supplier,
          quantity,
          date,
          status,
        },
        userId
      );

      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  /**
   * Deletes a order by id
   * DELETE /api/orders/delete/:id
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const check = await orderService.findById(id);
      if (!check) {
        res.status(404).json({ error: "Not found" });
        return;
      }

      const deletedOrder = await orderService.deleteByIdAndUserId(id, userId);

      if (!deletedOrder) {
        return res.status(404).json({ message: "You dont have permissions" });
      }

      res.status(200).json({ message: "Provider deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Partially updates a order by id
   * PATCH /api/orders/update/:id
   */
  async partialUpdate(req, res) {
    try {
      const { id } = req.params;
      const updatedOrder = await orderService.updateById(id, req.body);
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.status(200).json(updatedOrder);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new orderController();
