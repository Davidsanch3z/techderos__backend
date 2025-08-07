function validateInventoryInput({
  name,
  price,
  quantity,
  category,
  supplierName,
  presentation,
  expirationDate,
  profitMargin,
}) {
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

  if (!supplierName || typeof supplierName !== "string") {
    return '"supplierName" is required and must be a string';
  }

  if (!presentation || typeof presentation !== "string") {
    return '"presentation" is required and must be a string';
  }

  if (!expirationDate || typeof expirationDate !== "string") {
    return '"expirationDate" is required and must be a string in YYYY-MM-DD format';
  } else {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(expirationDate)) {
      return '"expirationDate" must be in YYYY-MM-DD format';
    }
  }

  if (profitMargin === undefined || isNaN(profitMargin)) {
    return '"profitMargin" is required and must be a number';
  }

  return null;
}

module.exports = {
  validateInventoryInput,
};
