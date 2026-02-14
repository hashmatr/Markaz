const { validationResult } = require('express-validator');

/**
 * Middleware to check validation results from express-validator
 * Place after validation rules in route chain
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation errors',
            errors: errors.array().map((err) => ({
                field: err.path,
                message: err.msg,
            })),
        });
    }
    next();
};

module.exports = validate;
