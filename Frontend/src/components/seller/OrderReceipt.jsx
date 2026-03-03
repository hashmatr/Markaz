import { useRef } from 'react';

/**
 * OrderReceipt — Professional invoice/receipt component for sellers.
 * Renders a print-ready receipt matching the Shopify invoice design.
 *
 * Props:
 *   order       — Full order object (populated with user, shippingAddress, orderItems.product)
 *   storeName   — Seller's store name
 *   storeEmail  — Seller's business email (optional)
 *   storePhone  — Seller's business phone (optional)
 *   storeAddress — Seller's store address string (optional)
 *   onClose     — Callback to close the receipt modal
 */
export default function OrderReceipt({ order, storeName, storeEmail, storePhone, storeAddress, onClose }) {
    const receiptRef = useRef(null);

    if (!order) return null;

    const invoiceNumber = order._id?.slice(-8).toUpperCase();
    const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    // Calculate totals from seller's items only
    const items = (order.orderItems || []).map(item => {
        const title = item.product?.title || 'Product';
        const unitPrice = item.discountedPrice || item.price || 0;
        const qty = item.quantity || 1;
        const lineTotal = unitPrice * qty;
        const image = item.product?.images?.[0]?.url || null;
        const size = item.size || '';
        const color = item.color || '';
        return { title, unitPrice, qty, lineTotal, image, size, color };
    });

    const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
    const shipping = order.shippingCost || 0;
    const discount = order.discount || 0;
    const firstOrderDiscount = order.firstOrderDiscount || 0;
    const totalDiscount = discount + firstOrderDiscount;
    const grandTotal = order.totalDiscountedPrice || order.totalPrice || subtotal + shipping - totalDiscount;

    // Shipping info
    const addr = order.shippingAddress;
    const customerName = addr?.fullName || order.user?.fullName || 'Customer';
    const customerEmail = order.user?.email || '';
    const customerPhone = addr?.phone || order.user?.phone || '';
    const customerAddress = addr
        ? [addr.street, addr.city, addr.state, addr.zipCode, addr.country].filter(Boolean).join(', ')
        : 'N/A';

    const paymentMethod = order.paymentMethod === 'COD' ? 'Cash on Delivery'
        : order.paymentMethod === 'online' ? 'Online Payment (Stripe)'
            : order.paymentMethod || 'N/A';

    const paymentStatus = order.paymentStatus || 'pending';

    const handlePrint = () => {
        const content = receiptRef.current;
        if (!content) return;

        const printWindow = window.open('', '_blank', 'width=800,height=900');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice #${invoiceNumber} - ${storeName}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a2e; background: #fff; }
                    @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .no-print { display: none !important; }
                    }
                </style>
            </head>
            <body>${content.innerHTML}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); }, 400);
    };

    const handleDownload = () => {
        const content = receiptRef.current;
        if (!content) return;

        const printWindow = window.open('', '_blank', 'width=800,height=900');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice #${invoiceNumber} - ${storeName}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a2e; background: #fff; }
                    @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    }
                </style>
            </head>
            <body>${content.innerHTML}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); }, 400);
    };

    // Inline styles (must be inline for print compatibility)
    const s = {
        overlay: {
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 200, padding: 20,
        },
        modal: {
            backgroundColor: '#fff', borderRadius: 24, width: '100%', maxWidth: 780,
            maxHeight: '92vh', overflowY: 'auto', position: 'relative',
            boxShadow: '0 25px 60px -12px rgba(0,0,0,0.3)',
        },
        toolbar: {
            position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#fff',
            borderBottom: '1px solid #f0f0f0', padding: '16px 32px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
        },
        receipt: {
            padding: '40px 48px 48px',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            color: '#1a1a2e', fontSize: 14, lineHeight: 1.6,
        },
        header: {
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            paddingBottom: 28, borderBottom: '3px solid #000',
            marginBottom: 28, flexWrap: 'wrap', gap: 20,
        },
        storeLogo: {
            fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px',
            color: '#000', fontFamily: "'Segoe UI', sans-serif",
        },
        sectionTitle: {
            fontSize: 10, fontWeight: 700, letterSpacing: '1.5px',
            textTransform: 'uppercase', color: '#8a8a9a', marginBottom: 6,
        },
        table: {
            width: '100%', borderCollapse: 'collapse', marginTop: 8,
        },
        th: {
            textAlign: 'left', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.5px', textTransform: 'uppercase',
            color: '#fff', backgroundColor: '#1a1a2e', padding: '10px 14px',
        },
        thRight: {
            textAlign: 'right', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.5px', textTransform: 'uppercase',
            color: '#fff', backgroundColor: '#1a1a2e', padding: '10px 14px',
        },
        td: {
            padding: '12px 14px', borderBottom: '1px solid #f0f0f0',
            fontSize: 13, verticalAlign: 'top',
        },
        tdRight: {
            padding: '12px 14px', borderBottom: '1px solid #f0f0f0',
            fontSize: 13, textAlign: 'right', verticalAlign: 'top',
        },
        totals: {
            marginTop: 24, display: 'flex', justifyContent: 'flex-end',
        },
        totalRow: {
            display: 'flex', justifyContent: 'space-between', padding: '6px 0',
            fontSize: 13, minWidth: 260,
        },
        grandTotal: {
            display: 'flex', justifyContent: 'space-between', padding: '10px 0',
            fontSize: 16, fontWeight: 800, borderTop: '2px solid #1a1a2e',
            marginTop: 4, minWidth: 260,
        },
        footer: {
            marginTop: 40, paddingTop: 20, borderTop: '1px solid #e5e5e5',
            textAlign: 'center', color: '#a3a3a3', fontSize: 11,
        },
    };

    return (
        <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={s.modal}>
                {/* ─── Toolbar (not printed) ─── */}
                <div style={s.toolbar}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Satoshi', sans-serif" }}>
                        Invoice Preview
                    </h3>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button
                            onClick={handleDownload}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '10px 20px', borderRadius: 12,
                                border: '1px solid #e5e5e5', background: '#fff',
                                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                            Download
                        </button>
                        <button
                            onClick={handlePrint}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '10px 20px', borderRadius: 12,
                                border: 'none', background: '#000', color: '#fff',
                                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#333'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#000'; }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
                            Print
                        </button>
                        <button
                            onClick={onClose}
                            style={{
                                width: 40, height: 40, borderRadius: 12,
                                border: '1px solid #e5e5e5', background: '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', fontSize: 18, color: '#525252',
                            }}
                        >✕</button>
                    </div>
                </div>

                {/* ─── Receipt Content (printable) ─── */}
                <div ref={receiptRef}>
                    <div style={s.receipt}>
                        {/* Header — Bill From & Store Logo */}
                        <div style={s.header}>
                            <div>
                                <p style={s.sectionTitle}>Bill From</p>
                                <p style={{ fontWeight: 700, fontSize: 15 }}>{storeName}</p>
                                {storeAddress && <p style={{ color: '#525252', fontSize: 13, maxWidth: 240 }}>{storeAddress}</p>}
                                {storePhone && <p style={{ color: '#525252', fontSize: 13 }}>{storePhone}</p>}
                                {storeEmail && <p style={{ color: '#525252', fontSize: 13 }}>{storeEmail}</p>}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={s.storeLogo}>{storeName}</p>
                                <p style={{ fontSize: 12, color: '#a3a3a3', marginTop: 4 }}>Powered by Markaz</p>
                            </div>
                        </div>

                        {/* Invoice details + Bill To */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24, marginBottom: 28 }}>
                            <div>
                                <p style={s.sectionTitle}>Bill To</p>
                                <p style={{ fontWeight: 700, fontSize: 15 }}>{customerName}</p>
                                <p style={{ color: '#525252', fontSize: 13, maxWidth: 260 }}>{customerAddress}</p>
                                {customerPhone && <p style={{ color: '#525252', fontSize: 13 }}>{customerPhone}</p>}
                                {customerEmail && <p style={{ color: '#525252', fontSize: 13 }}>{customerEmail}</p>}
                            </div>
                            <div style={{ textAlign: 'right', minWidth: 200 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, marginBottom: 6 }}>
                                    <span style={{ ...s.sectionTitle, marginBottom: 0 }}>Invoice #</span>
                                    <span style={{ fontSize: 13, fontWeight: 600 }}>{invoiceNumber}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, marginBottom: 6 }}>
                                    <span style={{ ...s.sectionTitle, marginBottom: 0 }}>Invoice Date</span>
                                    <span style={{ fontSize: 13 }}>{invoiceDate}</span>
                                </div>
                                <div style={{
                                    display: 'flex', justifyContent: 'space-between', gap: 24,
                                    backgroundColor: '#1a1a2e', color: '#fff', padding: '8px 14px',
                                    borderRadius: 8, marginTop: 8,
                                }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Amount Due</span>
                                    <span style={{ fontSize: 15, fontWeight: 800 }}>
                                        PKR {grandTotal.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Payment & Order Info */}
                        <div style={{
                            display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24,
                        }}>
                            <div style={{
                                flex: '1 1 200px', padding: '12px 16px', backgroundColor: '#f8f9fa',
                                borderRadius: 10, border: '1px solid #f0f0f0',
                            }}>
                                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#8a8a9a', marginBottom: 2 }}>Payment Method</p>
                                <p style={{ fontWeight: 600, fontSize: 13 }}>{paymentMethod}</p>
                            </div>
                            <div style={{
                                flex: '1 1 200px', padding: '12px 16px', backgroundColor: '#f8f9fa',
                                borderRadius: 10, border: '1px solid #f0f0f0',
                            }}>
                                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#8a8a9a', marginBottom: 2 }}>Payment Status</p>
                                <p style={{
                                    fontWeight: 600, fontSize: 13, textTransform: 'capitalize',
                                    color: paymentStatus === 'paid' ? '#059669' : paymentStatus === 'failed' ? '#dc2626' : '#d97706',
                                }}>{paymentStatus}</p>
                            </div>
                            <div style={{
                                flex: '1 1 200px', padding: '12px 16px', backgroundColor: '#f8f9fa',
                                borderRadius: 10, border: '1px solid #f0f0f0',
                            }}>
                                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#8a8a9a', marginBottom: 2 }}>Order Status</p>
                                <p style={{ fontWeight: 600, fontSize: 13, textTransform: 'capitalize' }}>{order.orderStatus}</p>
                            </div>
                        </div>

                        {/* Items Table */}
                        <table style={s.table}>
                            <thead>
                                <tr>
                                    <th style={s.th}>Item</th>
                                    <th style={s.th}>Description</th>
                                    <th style={{ ...s.thRight, textAlign: 'center' }}>Qty</th>
                                    <th style={s.thRight}>Unit Price</th>
                                    <th style={s.thRight}>Line Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, idx) => (
                                    <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                                        <td style={s.td}>
                                            <span style={{ fontWeight: 600 }}>{item.title}</span>
                                        </td>
                                        <td style={s.td}>
                                            <span style={{ color: '#737373', fontSize: 12 }}>
                                                {[item.size && `Size: ${item.size}`, item.color && `Color: ${item.color}`].filter(Boolean).join(' • ') || '—'}
                                            </span>
                                        </td>
                                        <td style={{ ...s.tdRight, textAlign: 'center' }}>{item.qty}</td>
                                        <td style={s.tdRight}>PKR {item.unitPrice.toLocaleString()}</td>
                                        <td style={{ ...s.tdRight, fontWeight: 600 }}>PKR {item.lineTotal.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Totals */}
                        <div style={s.totals}>
                            <div>
                                <div style={s.totalRow}>
                                    <span style={{ color: '#737373' }}>Subtotal</span>
                                    <span style={{ fontWeight: 600 }}>PKR {subtotal.toLocaleString()}</span>
                                </div>
                                {shipping > 0 && (
                                    <div style={s.totalRow}>
                                        <span style={{ color: '#737373' }}>Shipping</span>
                                        <span>PKR {shipping.toLocaleString()}</span>
                                    </div>
                                )}
                                {shipping === 0 && (
                                    <div style={s.totalRow}>
                                        <span style={{ color: '#737373' }}>Shipping</span>
                                        <span style={{ color: '#059669', fontWeight: 600 }}>FREE</span>
                                    </div>
                                )}
                                {totalDiscount > 0 && (
                                    <div style={s.totalRow}>
                                        <span style={{ color: '#737373' }}>Discount</span>
                                        <span style={{ color: '#dc2626' }}>-PKR {totalDiscount.toLocaleString()}</span>
                                    </div>
                                )}
                                <div style={s.grandTotal}>
                                    <span>Total</span>
                                    <span>PKR {grandTotal.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        {order.orderNotes && (
                            <div style={{
                                marginTop: 28, padding: '16px 20px', backgroundColor: '#fffbeb',
                                borderRadius: 10, border: '1px solid #fef3c7',
                            }}>
                                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#92400e', marginBottom: 4 }}>Notes / Memo</p>
                                <p style={{ fontSize: 13, color: '#78350f' }}>{order.orderNotes}</p>
                            </div>
                        )}

                        {/* Footer */}
                        <div style={s.footer}>
                            <p style={{ marginBottom: 6 }}>Thank you for your purchase!</p>
                            <p>Invoice powered by <span style={{ fontWeight: 700, color: '#000' }}>Markaz</span></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
