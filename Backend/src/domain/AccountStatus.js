/**
 * Seller Account Status Definitions
 */
const AccountStatus = {
  PENDING: 'pending',     // Initial state after registration, waiting for document upload
  UNDER_REVIEW: 'review', // Documents uploaded, waiting for Admin approval
  ACTIVE: 'active',       // Approved and can sell products
  SUSPENDED: 'suspended', // Blocked by admin (e.g., due to bad ratings or policy violations)
  REJECTED: 'rejected',   // Application denied (e.g., fake GST details)
  INACTIVE: 'inactive'    // Seller manually deactivated their own store
};

module.exports = AccountStatus;