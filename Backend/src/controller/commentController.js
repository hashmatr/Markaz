const ProductComment = require('../Modal/ProductComment');
const Product = require('../Modal/Product');
const Seller = require('../Modal/seller');
const asyncHandler = require('../middleware/asyncHandler');

class CommentController {
    /**
     * GET /api/comments/product/:productId
     * Get all comments for a product (threaded)
     */
    getProductComments = asyncHandler(async (req, res) => {
        const { productId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Get top-level comments
        const comments = await ProductComment.find({
            product: productId,
            parentComment: null,
        })
            .populate('user', 'fullName avatar role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Get replies for each comment
        const commentIds = comments.map(c => c._id);
        const replies = await ProductComment.find({
            parentComment: { $in: commentIds },
        })
            .populate('user', 'fullName avatar role')
            .sort({ createdAt: 1 });

        // Map replies to their parent comments
        const replyMap = {};
        replies.forEach(reply => {
            const parentId = reply.parentComment.toString();
            if (!replyMap[parentId]) replyMap[parentId] = [];
            replyMap[parentId].push(reply);
        });

        const threaded = comments.map(comment => ({
            ...comment.toObject(),
            replies: replyMap[comment._id.toString()] || [],
        }));

        const total = await ProductComment.countDocuments({
            product: productId,
            parentComment: null,
        });

        return res.status(200).json({
            success: true,
            data: {
                comments: threaded,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalComments: total,
                },
            },
        });
    });

    /**
     * POST /api/comments
     * Create a new comment or reply
     */
    createComment = asyncHandler(async (req, res) => {
        const { productId, message, parentCommentId } = req.body;
        const userId = req.user._id;

        // Check if product exists
        const product = await Product.findById(productId).populate('seller');
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Check if this user is the seller (for seller reply flag)
        const seller = await Seller.findOne({ user: userId });
        const isSellerReply = seller && product.seller._id.toString() === seller._id.toString();

        const comment = await ProductComment.create({
            product: productId,
            user: userId,
            message,
            parentComment: parentCommentId || null,
            isSellerReply,
        });

        // NOTIFICATION: Trigger notification for the seller if they are not the one commenting
        if (!isSellerReply) {
            const Notification = require('../Modal/Notification');
            await Notification.create({
                recipient: product.seller.user, // Assuming seller model has a 'user' field that is the ObjectId of the User
                type: 'COMMENT',
                title: 'New Comment on Your Product',
                message: `${req.user.fullName} commented on your product: "${product.title}"`,
                link: `/product/${product._id}?tab=qa&commentId=${comment._id}`,
            });
        }

        const populated = await ProductComment.findById(comment._id)
            .populate('user', 'fullName avatar role');

        return res.status(201).json({
            success: true,
            data: { comment: populated },
        });
    });

    /**
     * PUT /api/comments/:id
     * Edit a comment (only by its author)
     */
    updateComment = asyncHandler(async (req, res) => {
        const comment = await ProductComment.findOne({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!comment) {
            return res.status(404).json({ success: false, message: 'Comment not found or unauthorized' });
        }

        comment.message = req.body.message;
        comment.isEdited = true;
        await comment.save();

        const populated = await ProductComment.findById(comment._id)
            .populate('user', 'fullName avatar role');

        return res.status(200).json({
            success: true,
            data: { comment: populated },
        });
    });

    /**
     * DELETE /api/comments/:id
     * Delete a comment (by author or admin)
     */
    deleteComment = asyncHandler(async (req, res) => {
        const filter = { _id: req.params.id };
        // Non-admin can only delete their own comments
        if (req.user.role !== 'ADMIN') {
            filter.user = req.user._id;
        }

        const comment = await ProductComment.findOne(filter);
        if (!comment) {
            return res.status(404).json({ success: false, message: 'Comment not found or unauthorized' });
        }

        // Delete all replies too
        await ProductComment.deleteMany({ parentComment: comment._id });
        await ProductComment.findByIdAndDelete(comment._id);

        return res.status(200).json({
            success: true,
            message: 'Comment deleted',
        });
    });
}

module.exports = new CommentController();
