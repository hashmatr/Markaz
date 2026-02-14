const Review = require('../Modal/Review');
const Product = require('../Modal/Product');
const Seller = require('../Modal/seller');
const Order = require('../Modal/Order');

class ReviewService {
    /**
     * Create a review (user must have purchased the product)
     */
    async createReview(userId, reviewData) {
        const { productId, rating, title, comment } = reviewData;

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            throw Object.assign(new Error('Product not found'), { status: 404 });
        }

        // Check if user has purchased & received this product
        const hasPurchased = await Order.findOne({
            user: userId,
            'orderItems.product': productId,
            'orderItems.itemStatus': 'delivered',
        });

        if (!hasPurchased) {
            throw Object.assign(new Error('You can only review products you have purchased and received'), { status: 400 });
        }

        // Check if user already reviewed this product
        const existingReview = await Review.findOne({ user: userId, product: productId });
        if (existingReview) {
            throw Object.assign(new Error('You have already reviewed this product'), { status: 409 });
        }

        // Create review
        const review = await Review.create({
            user: userId,
            product: productId,
            seller: product.seller,
            rating,
            title,
            comment,
        });

        // Update product rating
        await this._updateProductRating(productId);

        // Update seller rating
        await this._updateSellerRating(product.seller);

        return review;
    }

    /**
     * Get reviews for a product
     */
    async getProductReviews(productId, query = {}) {
        const { page = 1, limit = 10, sort } = query;
        const filter = { product: productId, isApproved: true };

        let sortOption = { createdAt: -1 };
        if (sort === 'rating_high') sortOption = { rating: -1 };
        else if (sort === 'rating_low') sortOption = { rating: 1 };
        else if (sort === 'newest') sortOption = { createdAt: -1 };

        const skip = (page - 1) * limit;
        const reviews = await Review.find(filter)
            .populate('user', 'fullName avatar')
            .sort(sortOption)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Review.countDocuments(filter);

        // Rating distribution
        const mongoose = require('mongoose');
        const ratingDistribution = await Review.aggregate([
            { $match: { product: new mongoose.Types.ObjectId(productId), isApproved: true } },
            { $group: { _id: '$rating', count: { $sum: 1 } } },
            { $sort: { _id: -1 } },
        ]);

        return {
            reviews,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalReviews: total,
            },
            ratingDistribution,
        };
    }

    /**
     * Update a review
     */
    async updateReview(reviewId, userId, updateData) {
        const review = await Review.findOne({ _id: reviewId, user: userId });
        if (!review) {
            throw Object.assign(new Error('Review not found or unauthorized'), { status: 404 });
        }

        if (updateData.rating) review.rating = updateData.rating;
        if (updateData.title) review.title = updateData.title;
        if (updateData.comment) review.comment = updateData.comment;

        await review.save();

        // Recalculate product rating
        await this._updateProductRating(review.product);
        await this._updateSellerRating(review.seller);

        return review;
    }

    /**
     * Delete a review
     */
    async deleteReview(reviewId, userId) {
        const review = await Review.findOne({ _id: reviewId, user: userId });
        if (!review) {
            throw Object.assign(new Error('Review not found or unauthorized'), { status: 404 });
        }

        const productId = review.product;
        const sellerId = review.seller;

        await Review.findByIdAndDelete(reviewId);

        // Recalculate ratings
        await this._updateProductRating(productId);
        await this._updateSellerRating(sellerId);

        return { message: 'Review deleted successfully' };
    }

    /**
     * Get seller's reviews
     */
    async getSellerReviews(sellerId, query = {}) {
        const { page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;

        const reviews = await Review.find({ seller: sellerId, isApproved: true })
            .populate('user', 'fullName avatar')
            .populate('product', 'title images')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Review.countDocuments({ seller: sellerId, isApproved: true });

        return {
            reviews,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalReviews: total,
            },
        };
    }

    /**
     * Recalculate product average rating
     * @private
     */
    async _updateProductRating(productId) {
        const stats = await Review.aggregate([
            { $match: { product: productId, isApproved: true } },
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 },
                },
            },
        ]);

        if (stats.length > 0) {
            await Product.findByIdAndUpdate(productId, {
                rating: Math.round(stats[0].avgRating * 10) / 10,
                totalReviews: stats[0].totalReviews,
            });
        } else {
            await Product.findByIdAndUpdate(productId, { rating: 0, totalReviews: 0 });
        }
    }

    /**
     * Recalculate seller average rating
     * @private
     */
    async _updateSellerRating(sellerId) {
        const stats = await Review.aggregate([
            { $match: { seller: sellerId, isApproved: true } },
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 },
                },
            },
        ]);

        if (stats.length > 0) {
            await Seller.findByIdAndUpdate(sellerId, {
                rating: Math.round(stats[0].avgRating * 10) / 10,
                totalReviews: stats[0].totalReviews,
            });
        } else {
            await Seller.findByIdAndUpdate(sellerId, { rating: 0, totalReviews: 0 });
        }
    }
}

module.exports = new ReviewService();
