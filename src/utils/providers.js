function validateProviderInput({
  title,
  ownerName,
  phoneNumber,
  whatsappNumber,
  email,
  address,
  deliveryDay,
  isActive,
}) {
  if (!title || typeof title !== "string") {
    return '"title" is required and must be a string';
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

  if (deliveryDay) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (typeof deliveryDay !== "string" || !dateRegex.test(deliveryDay)) {
      return '"deliveryDay" must be a string in YYYY-MM-DD format';
    }
  }

  if (isActive !== undefined && typeof isActive !== "boolean") {
    return '"isActive" must be a boolean';
  }

  return null;
}

module.exports = { validateProviderInput };
