function validateProviderInput({
  title,
  ownerName,
  phoneNumber,
  whatsappNumber,
  email,
  address,
  deliveryDay,
  isActive,
  objectId,
}) {
  if (!title || typeof title !== "string") {
    return '"title" is required and must be a string';
  }

  if (!deliveryDay || typeof deliveryDay !== "string") {
    return '"deliveryDay" is required and must be a string';
  }

  if (!ownerName || typeof ownerName !== "string") {
    return '"ownerName" is required and must be a string';
  }

  if (phoneNumber && typeof phoneNumber !== "string") {
    return '"phoneNumber" must be a string';
  }

  if (whatsappNumber && typeof whatsappNumber !== "string") {
    return '"whatsappNumber" must be a string';
  }

  if (email && typeof email !== "string") {
    return '"email" must be a string';
  }

  if (address && typeof address !== "string") {
    return '"address" must be a string';
  }

  if (isActive !== undefined && typeof isActive !== "boolean") {
    return '"isActive" must be a boolean';
  }

  if (!("objectId" in arguments[0])) {
    return '"objectId" is required';
  }
  if (objectId !== null && typeof objectId !== "string") {
    return '"objectId" must be a string or null';
  }

  return null;
}

module.exports = { validateProviderInput };
