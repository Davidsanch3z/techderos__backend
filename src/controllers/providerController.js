const { validateProviderInput } = require("../utils/providers");
const providerService = require("../services/providerService");
const objectsService = require("../services/objectsService");

class ProviderController {
  /**
   * Returns a list of providers
   * GET /api/providers/list
   */
  async list(req, res) {
    try {
      const userId = req.user.id;
      const providers = await providerService.findByUserId(userId);
      res.status(200).json(providers);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Returns a provider by id
   * GET /api/providers/get/:id
   */
  async retrieve(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const provider = await providerService.findByIdAndUserId(id, userId);

      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }

      const object = await objectsService.getObject(userId, provider.objectId);
      res.status(200).json({ ...provider, object });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Creates a new provider
   * POST /api/providers/create
   */
  async create(req, res) {
    try {
      const userId = req.user.id;
      const validationError = validateProviderInput(req.body);

      if (validationError) {
        return res.status(400).json({ error: validationError });
      }

      const provider = await providerService.create(req.body, userId);
      res.status(201).json(provider);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Deletes a provider by id
   * DELETE /api/providers/delete/:id
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const deletedProvider = await providerService.deleteByIdAndUserId(
        id,
        userId
      );

      if (!deletedProvider) {
        return res.status(404).json({ message: "Provider not found" });
      }

      res
        .status(200)
        .json({ message: "Provider deleted successfully", deletedProvider });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Partially updates a provider by id
   * PATCH /api/providers/update/:id
   */
  async partialUpdate(req, res) {
    try {
      const { id } = req.params;
      const updatedProvider = await providerService.updateById(id, req.body);
      if (!updatedProvider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      res.status(200).json(updatedProvider);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ProviderController();
