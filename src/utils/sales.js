function validateSalesInput({
  date,
  customer,
  customerEmail,
  products,
  paymentMethod,
  total,
  amount,
}) {
  if (!date || isNaN(Date.parse(date))) {
    return '"date" is required and must be a valid date';
  }
  if (!customer || typeof customer !== "string") {
    return '"customer" is required and must be a string';
  }
  if (!customerEmail && typeof customerEmail !== "string") {
    return '"customerEmail" must be a string';
  }
  if (!products || typeof products !== "string") {
    return '"products" is required and must be a string';
  }
  if (!paymentMethod || typeof paymentMethod !== "string") {
    return '"paymentMethod" is required and must be a string';
  }
  if (!total&& total === undefined || isNaN(total)) {
    return '"total" is required and must be a number';
  }
  if (!amount && amount === undefined || isNaN(amount)) {
    return '"amount" is required and must be a number';
  }
  return null;
}

module.exports = { validateSalesInput };
