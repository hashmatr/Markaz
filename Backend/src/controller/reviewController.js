const reviewService = require('../Service/reviewService');
const asyncHandler = require('../middleware/asyncHandler');

class ReviewController {
    /**
     * POST /api/reviews - Create review
     */
    createReview = asyncHandler(async (req, res) => {
        const review = await reviewService.createReview(req.user._id, req.body);

        return res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            data: { review },
        });
    });

    /**
     * GET /api/reviews/product/:productId - Get product reviews
     */
    getProductReviews = asyncHandler(async (req, res) => {
        const result = await reviewService.getProductReviews(req.params.productId, req.query);

        return res.status(200).json({
            success: true,
            data: result,
        });
    });

    /**
     * GET /api/reviews/seller/:sellerId - Get seller reviews
     */
    getSellerReviews = asyncHandler(async (req, res) => {
        const result = await reviewService.getSellerReviews(req.params.sellerId, req.query);

        return res.status(200).json({
            success: true,
            data: result,
        });
    });

    /**
     * PUT /api/reviews/:id - Update review
     */
    updateReview = asyncHandler(async (req, res) => {
        const review = await reviewService.updateReview(req.params.id, req.user._id, req.body);

        return res.status(200).json({
            success: true,
            message: 'Review updated successfully',
            data: { review },
        });
    });

    /**
     * DELETE /api/reviews/:id - Delete review
     */
    deleteReview = asyncHandler(async (req, res) => {
        const result = await reviewService.deleteReview(req.params.id, req.user._id);

        return res.status(200).json({
            success: true,
            message: result.message,
        });
    });
}

module.exports = new ReviewController();
