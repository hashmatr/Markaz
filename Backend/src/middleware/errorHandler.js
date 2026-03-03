/**
 * Global Error Handler Middleware
 * Place this after all other middleware and routes in app.js
 * app.use(errorHandler);
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  // Default error
  let status = err.status || 500;
  let message = err.message || 'Internal Server Error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    status = 400;
    // Extract specific validation messages
    const messages = Object.values(err.errors).map(val => val.message);
    message = messages.join(', ') || 'Validation Error';
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Resource not found with id ${err.value}`;
    console.error(`[CastError] ${message} - Path: ${err.path}, Value: ${err.value}`);
  } else if (err.status === 400) {
    console.error(`[BadRequest] Status 400 error: ${err.message}`);
  } else if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token expired';
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }

  return res.status(status).json({
    success: false,
    message: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
};

module.exports = errorHandler;
