const { validateQrInput } = require("../utils/qr");
const qrService = require("../services/qrService");
const objectsService = require("../services/objectsService");

class QrController {
  /**
   * List all QRs for the authenticated user
   * POST /api/qr/list/
   */
  async list(req, res) {
    try {
      const userId = req.user.id;
      const result = await qrService.findAll(userId);
      const mappedResult = await Promise.all(
        result.map(async (qr) => ({
          ...qr,
          object: await objectsService.getObject(userId, qr.objectId),
        }))
      );

      res.status(200).json(mappedResult);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Create a new QR for the authenticated user
   * POST /api/qr/create/
   */
  async create(req, res) {
    try {
      const userId = req.user.id;
      const { name, objectId } = req.body;

      const validationError = validateQrInput(req.body);

      if (validationError) {
        return res.status(400).json({ error: validationError });
      }

      const response = await qrService.createQr(
        {
          name,
          objectId,
        },
        userId
      );
      res.status(201).json(response);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Retrieve a QR by ID for the authenticated user
   * GET /api/qr/get/:id
   */
  async retrieve(req, res) {
    try {
      const userId = req.user.id;
      const itemId = req.params.id;
      const result = await qrService.findByIdAndUserId(itemId, userId);

      if (!result) {
        return res.status(404).json({ error: "Not found" });
      }

      const object = await objectsService.getObject(userId, result.objectId);
      res.status(200).json({ ...result, object });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Delete a QR by ID for the authenticated user
   * DELETE /api/qr/delete/:id
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const deletedQr = await qrService.deleteByIdAndUserId(id, userId);

      if (!deletedQr) {
        return res.status(404).json({ message: "Provider not found" });
      }

      res.status(200).json({ message: "Deleted successfully", deletedQr });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new QrController();
