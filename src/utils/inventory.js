function validateInventoryInput({ name, price, quantity, category }) {
  if (!name || typeof name !== "string") {
    return '"name" is required and must be a string';
  }
  if (price === undefined || isNaN(price)) {
    return '"price" is required and must be a number';
  }
  if (quantity === undefined || !Number.isInteger(quantity)) {
    return '"quantity" is required and must be an integer';
  }
  if (!category || typeof category !== "string") {
    return '"category" is required and must be a string';
  }
  return null;
}

module.exports = {
  validateInventoryInput,
};
