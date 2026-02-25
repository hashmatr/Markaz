import { useState, useEffect } from 'react';
import { FiMessageSquare, FiSend, FiCornerDownRight, FiTrash2, FiEdit3, FiCheck, FiX } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { commentAPI } from '../../api';
import toast from 'react-hot-toast';

export default function ProductComments({ productId, sellerId }) {
    const { user } = useAuth();
    const [comments, setComments] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editMessage, setEditMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchComments();
    }, [productId, page]);

    const fetchComments = async () => {
        try {
            const res = await commentAPI.getProductComments(productId, { page, limit: 10 });
            setComments(res.data.data.comments || []);
            setTotalPages(res.data.data.pagination?.totalPages || 1);
        } catch { setComments([]); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) { toast.error('Please login to ask a question'); return; }
        if (!newMessage.trim()) return;
        setSubmitting(true);
        try {
            await commentAPI.create({ productId, message: newMessage.trim() });
            setNewMessage('');
            fetchComments();
            toast.success('Question posted!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to post');
        } finally { setSubmitting(false); }
    };

    const handleReply = async (parentId) => {
        if (!user) { toast.error('Please login to reply'); return; }
        if (!replyMessage.trim()) return;
        setSubmitting(true);
        try {
            await commentAPI.create({ productId, message: replyMessage.trim(), parentCommentId: parentId });
            setReplyTo(null);
            setReplyMessage('');
            fetchComments();
            toast.success('Reply posted!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reply');
        } finally { setSubmitting(false); }
    };

    const handleEdit = async (commentId) => {
        if (!editMessage.trim()) return;
        try {
            await commentAPI.update(commentId, { message: editMessage.trim() });
            setEditingId(null);
            setEditMessage('');
            fetchComments();
            toast.success('Comment updated');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update');
        }
    };

    const handleDelete = async (commentId) => {
        if (!window.confirm('Delete this comment?')) return;
        try {
            await commentAPI.delete(commentId);
            fetchComments();
            toast.success('Comment deleted');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete');
        }
    };

    const timeAgo = (date) => {
        const mins = Math.floor((Date.now() - new Date(date)) / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 30) return `${days}d ago`;
        return new Date(date).toLocaleDateString();
    };

    return (
        <div style={{ marginTop: '32px' }}>
            <div style={{
                display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px',
            }}>
                <FiMessageSquare size={20} />
                <h3 style={{
                    fontSize: '18px', fontWeight: 700,
                    fontFamily: "'Satoshi', sans-serif",
                }}>
                    Questions & Answers
                    <span style={{ color: '#a3a3a3', fontWeight: 400, fontSize: '14px', marginLeft: '8px' }}>
                        ({comments.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0)})
                    </span>
                </h3>
            </div>

            {/* Ask a Question form */}
            <form onSubmit={handleSubmit} style={{
                display: 'flex', gap: '12px', marginBottom: '24px',
            }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={user ? "Ask a question about this product..." : "Login to ask a question..."}
                        disabled={!user}
                        style={{
                            width: '100%', padding: '14px 16px', borderRadius: '14px',
                            border: '2px solid #e5e5e5', outline: 'none', fontSize: '14px',
                            fontFamily: "'Satoshi', sans-serif", transition: 'border-color 0.2s',
                            backgroundColor: '#fafafa',
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#000'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e5e5'}
                    />
                </div>
                <button
                    type="submit"
                    disabled={submitting || !user || !newMessage.trim()}
                    style={{
                        padding: '14px 24px', borderRadius: '14px',
                        background: '#000', color: '#fff', border: 'none',
                        cursor: submitting || !user ? 'not-allowed' : 'pointer',
                        opacity: submitting || !user || !newMessage.trim() ? 0.5 : 1,
                        display: 'flex', alignItems: 'center', gap: '8px',
                        fontWeight: 600, fontSize: '14px', transition: 'all 0.2s',
                    }}
                >
                    <FiSend size={16} />
                    {submitting ? 'Posting...' : 'Ask'}
                </button>
            </form>

            {/* Comments List */}
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{
                            height: '80px', backgroundColor: '#f5f5f5', borderRadius: '16px',
                            animation: 'pulse 1.5s infinite',
                        }} />
                    ))}
                </div>
            ) : comments.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '48px 0',
                    border: '1px dashed #e5e5e5', borderRadius: '16px',
                }}>
                    <FiMessageSquare size={32} style={{ color: '#d4d4d4', marginBottom: '12px' }} />
                    <p style={{ color: '#737373', fontSize: '14px' }}>
                        No questions yet. Be the first to ask!
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {comments.map(comment => (
                        <div key={comment._id} style={{
                            border: '1px solid #f0f0f0', borderRadius: '16px',
                            overflow: 'hidden',
                        }}>
                            {/* Parent comment */}
                            <div style={{ padding: '16px 20px' }}>
                                <div style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    alignItems: 'flex-start', marginBottom: '8px',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '50%',
                                            backgroundColor: comment.isSellerReply ? '#000' : '#f0f0f0',
                                            color: comment.isSellerReply ? '#fff' : '#000',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '13px', fontWeight: 700, flexShrink: 0,
                                        }}>
                                            {comment.user?.fullName?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{ fontWeight: 600, fontSize: '13px' }}>
                                                    {comment.user?.fullName || 'Anonymous'}
                                                </span>
                                                {comment.isSellerReply && (
                                                    <span style={{
                                                        background: '#000', color: '#fff',
                                                        padding: '2px 8px', borderRadius: '9999px',
                                                        fontSize: '10px', fontWeight: 600,
                                                    }}>
                                                        SELLER
                                                    </span>
                                                )}
                                                {comment.isEdited && (
                                                    <span style={{ color: '#a3a3a3', fontSize: '11px' }}>(edited)</span>
                                                )}
                                            </div>
                                            <span style={{ color: '#a3a3a3', fontSize: '11px' }}>{timeAgo(comment.createdAt)}</span>
                                        </div>
                                    </div>
                                    {/* Actions */}
                                    {user && (user._id === comment.user?._id || user.role === 'ADMIN') && (
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button onClick={() => { setEditingId(comment._id); setEditMessage(comment.message); }}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a3a3a3', padding: '4px' }}>
                                                <FiEdit3 size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(comment._id)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}>
                                                <FiTrash2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Edit mode */}
                                {editingId === comment._id ? (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <input value={editMessage} onChange={(e) => setEditMessage(e.target.value)}
                                            style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '13px', outline: 'none' }} />
                                        <button onClick={() => handleEdit(comment._id)}
                                            style={{ background: '#000', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}>
                                            <FiCheck size={14} />
                                        </button>
                                        <button onClick={() => { setEditingId(null); setEditMessage(''); }}
                                            style={{ background: '#f5f5f5', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}>
                                            <FiX size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>{comment.message}</p>
                                )}

                                {/* Reply button */}
                                {user && editingId !== comment._id && (
                                    <button onClick={() => setReplyTo(replyTo === comment._id ? null : comment._id)}
                                        style={{
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            color: '#737373', fontSize: '12px', marginTop: '8px',
                                            display: 'flex', alignItems: 'center', gap: '4px',
                                            fontWeight: 500,
                                        }}>
                                        <FiCornerDownRight size={12} /> Reply
                                    </button>
                                )}
                            </div>

                            {/* Replies */}
                            {comment.replies?.length > 0 && (
                                <div style={{ borderTop: '1px solid #f0f0f0', background: '#fafafa' }}>
                                    {comment.replies.map(reply => (
                                        <div key={reply._id} style={{
                                            padding: '12px 20px 12px 52px',
                                            borderBottom: '1px solid #f0f0f0',
                                        }}>
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px',
                                            }}>
                                                <div style={{
                                                    width: '24px', height: '24px', borderRadius: '50%',
                                                    backgroundColor: reply.isSellerReply ? '#000' : '#e5e5e5',
                                                    color: reply.isSellerReply ? '#fff' : '#000',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '10px', fontWeight: 700, flexShrink: 0,
                                                }}>
                                                    {reply.user?.fullName?.charAt(0) || '?'}
                                                </div>
                                                <span style={{ fontWeight: 600, fontSize: '12px' }}>
                                                    {reply.user?.fullName || 'Anonymous'}
                                                </span>
                                                {reply.isSellerReply && (
                                                    <span style={{
                                                        background: '#000', color: '#fff',
                                                        padding: '1px 6px', borderRadius: '9999px',
                                                        fontSize: '9px', fontWeight: 700,
                                                    }}>
                                                        SELLER
                                                    </span>
                                                )}
                                                <span style={{ color: '#a3a3a3', fontSize: '11px' }}>{timeAgo(reply.createdAt)}</span>
                                            </div>
                                            <p style={{ fontSize: '13px', color: '#525252', lineHeight: 1.5, paddingLeft: '32px' }}>
                                                {reply.message}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Reply form */}
                            {replyTo === comment._id && (
                                <div style={{
                                    padding: '12px 20px', borderTop: '1px solid #f0f0f0',
                                    background: '#fafafa', display: 'flex', gap: '8px',
                                }}>
                                    <input
                                        value={replyMessage}
                                        onChange={(e) => setReplyMessage(e.target.value)}
                                        placeholder="Write a reply..."
                                        autoFocus
                                        style={{
                                            flex: 1, padding: '10px 14px', borderRadius: '10px',
                                            border: '1px solid #e5e5e5', fontSize: '13px', outline: 'none',
                                        }}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleReply(comment._id); }}
                                    />
                                    <button
                                        onClick={() => handleReply(comment._id)}
                                        disabled={submitting || !replyMessage.trim()}
                                        style={{
                                            padding: '10px 18px', borderRadius: '10px',
                                            background: '#000', color: '#fff', border: 'none',
                                            cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                                            opacity: submitting || !replyMessage.trim() ? 0.5 : 1,
                                        }}
                                    >
                                        Reply
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                <button key={p} onClick={() => setPage(p)}
                                    style={{
                                        width: '32px', height: '32px', borderRadius: '8px',
                                        border: '1px solid #e5e5e5', cursor: 'pointer',
                                        background: p === page ? '#000' : '#fff',
                                        color: p === page ? '#fff' : '#000',
                                        fontSize: '13px',
                                    }}>
                                    {p}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
