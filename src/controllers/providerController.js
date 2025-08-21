const { validateProviderInput } = require("../utils/providers");
const providerService = require("../services/providerService");

class ProviderController {
  /**
   * Returns a list of providers
   * GET /api/providers/list
   */
  async list(req, res) {
    try {
      const providers = await providerService.findAll();
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
      const provider = await providerService.findById(id);

      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }

      res.status(200).json(provider);
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
      const validationError = validateProviderInput(req.body);
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }

      const provider = await providerService.create(req.body);
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
      const deletedProvider = await providerService.deleteById(id);

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