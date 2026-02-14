const sellerService = require('../Service/sellerService');
const asyncHandler = require('../middleware/asyncHandler');

class SellerController {
    /**
     * POST /api/seller/register
     */
    registerSeller = asyncHandler(async (req, res) => {
        const seller = await sellerService.registerSeller(req.user._id, req.body);

        return res.status(201).json({
            success: true,
            message: 'Seller registration successful. Awaiting admin approval.',
            data: { seller },
        });
    });

    /**
     * GET /api/seller/profile
     */
    getSellerProfile = asyncHandler(async (req, res) => {
        const seller = await sellerService.getSellerByUserId(req.user._id);

        return res.status(200).json({
            success: true,
            data: { seller },
        });
    });

    /**
     * GET /api/seller/:id
     */
    getSellerById = asyncHandler(async (req, res) => {
        const seller = await sellerService.getSellerById(req.params.id);

        return res.status(200).json({
            success: true,
            data: { seller },
        });
    });

    /**
     * GET /api/seller/store/:slug
     */
    getSellerBySlug = asyncHandler(async (req, res) => {
        const seller = await sellerService.getSellerBySlug(req.params.slug);

        return res.status(200).json({
            success: true,
            data: { seller },
        });
    });

    /**
     * GET /api/seller/all
     */
    getAllSellers = asyncHandler(async (req, res) => {
        const result = await sellerService.getAllSellers(req.query);

        return res.status(200).json({
            success: true,
            data: result,
        });
    });

    /**
     * PUT /api/seller/profile
     */
    updateSeller = asyncHandler(async (req, res) => {
        const seller = await sellerService.getSellerByUserId(req.user._id);
        const updatedSeller = await sellerService.updateSeller(seller._id, req.user._id, req.body);

        return res.status(200).json({
            success: true,
            message: 'Seller profile updated successfully',
            data: { seller: updatedSeller },
        });
    });

    /**
     * GET /api/seller/dashboard
     */
    getSellerDashboard = asyncHandler(async (req, res) => {
        const dashboard = await sellerService.getSellerDashboard(req.user._id);

        return res.status(200).json({
            success: true,
            data: { dashboard },
        });
    });

    /**
     * PUT /api/seller/:id/status (Admin)
     */
    updateSellerStatus = asyncHandler(async (req, res) => {
        const seller = await sellerService.updateSellerStatus(req.params.id, req.body.status);

        return res.status(200).json({
            success: true,
            message: 'Seller status updated successfully',
            data: { seller },
        });
    });

    /**
     * DELETE /api/seller/:id (Admin)
     */
    deleteSeller = asyncHandler(async (req, res) => {
        const result = await sellerService.deleteSeller(req.params.id);

        return res.status(200).json({
            success: true,
            message: result.message,
        });
    });
}

module.exports = new SellerController();