const slugify = require('slugify');

/**
 * Generates a unique slug for a given model and field
 * @param {Object} Model - Mongoose model
 * @param {String} field - Field name for slug (e.g., 'slug' or 'storeSlug')
 * @param {String} name - The name to generate slug from
 * @returns {Promise<String>} - A unique slug
 */
const generateUniqueSlug = async (Model, field, name) => {
    if (!name) return '';

    // Initial slug generation
    let slug = slugify(name, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });

    // Check for existence
    let uniqueSlug = slug;
    let counter = 1;

    // Loop until unique slug is found
    while (await Model.findOne({ [field]: uniqueSlug })) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
    }

    return uniqueSlug;
};

module.exports = { generateUniqueSlug };
