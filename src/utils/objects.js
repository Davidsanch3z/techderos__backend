const ALLOWED_IMAGE_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "bmp",
  "svg",
];

function isAllowedImageExtension(filename) {
  const ext = filename.split(".").pop().toLowerCase();
  return ALLOWED_IMAGE_EXTENSIONS.includes(ext);
}

function validateUploadInput({ name, data }) {
  if (!name || typeof name !== "string") {
    return '"name" is required and must be a string';
  }

  if (!data || typeof data !== "string") {
    return '"data" is required and must be a base64 string';
  }

  return null;
}

module.exports = {
  validateUploadInput,
  isAllowedImageExtension,
};
