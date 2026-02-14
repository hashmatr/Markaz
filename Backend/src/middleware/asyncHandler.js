/**
 * Async Handler Middleware
 * Wraps async route handlers to catch errors and pass to error middleware
 * Usage: router.post('/route', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
