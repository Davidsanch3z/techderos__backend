function validateQrInput({ name, objectId }) {
  if (!name || typeof name !== "string") {
    return '"name" is required and must be a string';
  }

  if ((!objectId && objectId === undefined) || typeof objectId !== "number") {
    return '"objectId" is required and must be a number';
  }

  return null;
}

module.exports = { validateQrInput };
