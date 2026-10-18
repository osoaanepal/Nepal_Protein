/**
 * Format currency in Nepalese Rupees (NPR)
 * Example: 7499 -> "Rs. 7,499"
 */
export const formatNpr = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return 'Rs. 0';
  }
  return `Rs. ${Number(amount).toLocaleString('en-IN')}`;
};
