class QrController {
  /**
   * ...
   * GET /api/objects/get/:id
   */
  async retrieve(req, res) {
    const userId = req.user.id;
    const itemId = req.params.id;
    res.status(200).json({ message: "QR DATA" });
  }
}

module.exports = new QrController();
