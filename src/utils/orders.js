function validateOrderInput({
  product,
  supplier,
  quantity,
  date,
  status,
}) {
  if (!product || typeof product !== "string") {
    return '"product" is required and must be a string';
  }

  if (!supplier || typeof supplier !== "string") {
    return '"supplier" is required and must be a string';
  }

  if (!quantity || typeof quantity !== "string") {
    return '"quantity" is required and must be a string';
  }

  if (!date || typeof date !== "string") {
    return '"date" is required and must be a string';
  }

  if (!status || typeof status !== "string") {
    return '"status" is required and must be a string';
  }

  return null;
}

module.exports = { validateOrderInput };
