const { isBase64 } = require("../utils/validators");
const { getUniqueFileName, saveInS3 } = require("../routes/storage");
const objectsService = require("../services/objectsService");
const {
  validateUploadInput,
  isAllowedImageExtension,
} = require("../utils/objects");

class ObjectsController {
  /**
   * Retrieve an object by ID for the current user
   * GET /api/objects/get/:id
   */
  async retrieve(req, res) {
    const userId = req.user.id;
    const itemId = req.params.id;
    try {
      const result = await objectsService.getObject(userId, itemId);
      if (!result) {
        return res.status(404).json({ message: "Object not found" });
      }
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error });
    }
  }

  /**
   * Create a new object for the current user
   * POST /api/objects/create
   */
  async create(req, res) {
    const { data, name } = req.body;
    const userId = req.user.id;

    const error = validateUploadInput(req.body);
    if (error) {
      return res.status(400).json({ error });
    }

    const objectName = getUniqueFileName(name);
    const base64Data = data.replace(/^data:\w+\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    if (!isAllowedImageExtension(name)) {
      return res.status(400).json({
        error: "Invalid file extension. Only image formats are allowed.",
      });
    }

    if (!isBase64(base64Data)) {
      return res.status(400).json({ error: "Invalid base64 data" });
    }

    try {
      await saveInS3(buffer, objectName);
    } catch (error) {
      res.status(500).json({ error: "Fail s3 upload error" });
    }

    try {
      const result = await objectsService.createObject(
        { name: objectName },
        userId
      );
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ error });
    }
  }

  /**
   * Remove an object by ID for the current user
   * DELETE /api/objects/delete/:id
   */
  async delete(req, res) {
    const userId = req.user.id;
    const itemId = req.params.id;
    try {
      const result = await objectsService.deleteObject(userId, itemId);
      if (!result) {
        return res.status(404).json({ message: "Object not found" });
      }
      res.status(200).json({});
    } catch (error) {
      res.status(500).json({ error });
    }
  }
}

module.exports = new ObjectsController();
