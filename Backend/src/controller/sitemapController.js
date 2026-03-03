const Product = require('../Modal/Product');
const Category = require('../Modal/Category');
const Seller = require('../Modal/seller');
const asyncHandler = require('../middleware/asyncHandler');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

class SitemapController {
    /**
     * GET /api/sitemap-index.xml
     */
    getSitemapIndex = asyncHandler(async (req, res) => {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        ['products', 'categories', 'vendors'].forEach(type => {
            xml += `  <sitemap>\n    <loc>${req.protocol}://${req.get('host')}/api/sitemap-${type}.xml</loc>\n  </sitemap>\n`;
        });

        xml += '</sitemapindex>';
        res.header('Content-Type', 'application/xml');
        res.status(200).send(xml);
    });

    /**
     * GET /api/sitemap-products.xml
     */
    getProductSitemap = asyncHandler(async (req, res) => {
        const products = await Product.find({ isActive: true }).select('slug updatedAt');
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        products.forEach(p => {
            if (p.slug) {
                xml += `  <url>\n    <loc>${CLIENT_URL}/product/${p.slug}</loc>\n    <lastmod>${p.updatedAt.toISOString().split('T')[0]}</lastmod>\n    <priority>0.8</priority>\n  </url>\n`;
            }
        });

        xml += '</urlset>';
        res.header('Content-Type', 'application/xml');
        res.status(200).send(xml);
    });

    /**
     * GET /api/sitemap-categories.xml
     */
    getCategorySitemap = asyncHandler(async (req, res) => {
        const categories = await Category.find().select('slug updatedAt');
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        categories.forEach(c => {
            if (c.slug) {
                xml += `  <url>\n    <loc>${CLIENT_URL}/category/${c.slug}</loc>\n    <priority>0.9</priority>\n  </url>\n`;
            }
        });

        xml += '</urlset>';
        res.header('Content-Type', 'application/xml');
        res.status(200).send(xml);
    });

    /**
     * GET /api/sitemap-vendors.xml
     */
    getVendorSitemap = asyncHandler(async (req, res) => {
        const sellers = await Seller.find({ status: 'active' }).select('storeSlug updatedAt');
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        sellers.forEach(s => {
            if (s.storeSlug) {
                xml += `  <url>\n    <loc>${CLIENT_URL}/vendor/${s.storeSlug}</loc>\n    <priority>0.7</priority>\n  </url>\n`;
            }
        });

        xml += '</urlset>';
        res.header('Content-Type', 'application/xml');
        res.status(200).send(xml);
    });
}

module.exports = new SitemapController();
