/**
 * Calculate platform commission and seller earnings
 * @param {number} totalAmount - Total order amount
 * @param {number} commissionRate - Commission percentage
 * @returns {{ commission: number, sellerEarnings: number, commissionRate: number }}
 */
const calculateCommission = (totalAmount, commissionRate) => {
    const rate = commissionRate || parseFloat(process.env.DEFAULT_COMMISSION_RATE) || 10;
    const commission = parseFloat(((totalAmount * rate) / 100).toFixed(2));
    const sellerEarnings = parseFloat((totalAmount - commission).toFixed(2));
    return { commission, sellerEarnings, commissionRate: rate };
};

module.exports = calculateCommission;
