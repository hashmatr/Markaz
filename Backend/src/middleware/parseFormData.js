/**
 * Middleware to parse JSON strings in form-data
 * Useful for fields like arrays or objects sent via FormData
 */
const parseFormData = (fields) => {
    return (req, res, next) => {
        fields.forEach(field => {
            if (req.body[field] && typeof req.body[field] === 'string') {
                try {
                    req.body[field] = JSON.parse(req.body[field]);
                } catch (error) {
                    // If parsing fails, keep it as is or handle error
                    console.error(`Error parsing field ${field}:`, error.message);
                }
            }
        });
        next();
    };
};

module.exports = parseFormData;
