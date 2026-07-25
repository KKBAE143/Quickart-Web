/**
 * Calculate Partial Prepayment and COD amounts for fraud prevention
 * 
 * Strategy: Customer pays small token (₹20-100) online, rest COD
 * This reduces fake orders by 60-80% through payment commitment
 * 
 * @param {number} orderTotal - Total order amount in rupees
 * @returns {object} - { prepaymentAmount, codAmount, total, percentage }
 */

const calculatePartialPayment = (orderTotal) => {
  // Configuration
  const MIN_PREPAYMENT = 20;      // Minimum ₹20 prepayment
  const MAX_PREPAYMENT = 100;     // Maximum ₹100 prepayment
  const PREPAYMENT_PERCENTAGE = 10; // 10% of order value

  // Calculate 10% of order
  const calculatedPrepayment = Math.round(orderTotal * (PREPAYMENT_PERCENTAGE / 100));

  // Apply min and max constraints
  const prepaymentAmount = Math.max(
    MIN_PREPAYMENT,                    // At least ₹20
    Math.min(calculatedPrepayment, MAX_PREPAYMENT)  // At most ₹100
  );

  // Calculate COD amount
  const codAmount = orderTotal - prepaymentAmount;

  // Calculate actual percentage
  const actualPercentage = ((prepaymentAmount / orderTotal) * 100).toFixed(1);

  return {
    prepaymentAmount,
    codAmount,
    total: orderTotal,
    percentage: parseFloat(actualPercentage)
  };
};

/**
 * Examples:
 * 
 * Order ₹1000:
 *   - Prepayment: ₹100 (10%, hits max cap)
 *   - COD: ₹900 (90%)
 * 
 * Order ₹500:
 *   - Prepayment: ₹50 (10%)
 *   - COD: ₹450 (90%)
 * 
 * Order ₹300:
 *   - Prepayment: ₹30 (10%)
 *   - COD: ₹270 (90%)
 * 
 * Order ₹150:
 *   - Prepayment: ₹20 (13.3%, hits min floor)
 *   - COD: ₹130 (86.7%)
 */

export default calculatePartialPayment;

