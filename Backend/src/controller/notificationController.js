const Notification = require('../Modal/Notification');
const asyncHandler = require('../middleware/asyncHandler');

class NotificationController {
    /**
     * GET /api/notifications
     * Get all notifications for the current user
     */
    getNotifications = asyncHandler(async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const notifications = await Notification.find({ recipient: req.user._id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Notification.countDocuments({ recipient: req.user._id });
        const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });

        return res.status(200).json({
            success: true,
            data: {
                notifications,
                unreadCount,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalNotifications: total,
                },
            },
        });
    });

    /**
     * PUT /api/notifications/:id/read
     * Mark a notification as read
     */
    markAsRead = asyncHandler(async (req, res) => {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user._id },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        return res.status(200).json({ success: true, data: { notification } });
    });

    /**
     * PUT /api/notifications/read-all
     * Mark all notifications as read
     */
    markAllAsRead = asyncHandler(async (req, res) => {
        await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });

        return res.status(200).json({ success: true, message: 'All notifications marked as read' });
    });

    /**
     * DELETE /api/notifications/:id
     * Delete a notification
     */
    deleteNotification = asyncHandler(async (req, res) => {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            recipient: req.user._id,
        });

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        return res.status(200).json({ success: true, message: 'Notification deleted' });
    });
}

module.exports = new NotificationController();
