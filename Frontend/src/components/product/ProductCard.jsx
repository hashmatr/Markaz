import { useState } from 'react';
import { Link } from 'react-router-dom';
import StarRating from '../ui/StarRating';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Cloudinary auto-optimization: f_auto (format), q_auto (quality), w_400 (resize for card)
function optimizeImg(url, width = 400) {
    if (!url || !url.includes('cloudinary.com')) return url;
    if (url.includes('f_auto')) return url;
    return url.replace(/\/upload\//, `/upload/f_auto,q_auto,w_${width}/`);
}

export default function ProductCard({ product }) {
    const {
        _id,
        title,
        images,
        price,
        discountedPrice,
        discountPercent,
        rating = 0,
        totalReviews = 0,
        seller,
        recommendationScore,
    } = product;

    const [hovered, setHovered] = useState(false);

    const rawImgSrc = images?.[0]?.url || 'https://placehold.co/300x300/f0f0f0/999?text=No+Image';
    const imgSrc = optimizeImg(rawImgSrc);
    const hasSecondImage = images?.length > 1 && images[1]?.url;
    const rawSecondImgSrc = hasSecondImage ? images[1].url : null;
    const secondImgSrc = rawSecondImgSrc ? optimizeImg(rawSecondImgSrc) : null;
    const sellerName = seller?.storeName || null;

    // Determine wrapper class based on whether we have a second image
    const wrapClass = `product-img-wrap ${hasSecondImage ? 'has-alt' : 'single-img'}${hovered ? ' is-hovered' : ''}`;

    return (
        <Link to={`/product/${_id}`} className="group block"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}>
            <div className={wrapClass}>
                {/* Primary image */}
                <img
                    src={imgSrc}
                    alt={title}
                    loading="lazy"
                    className="product-img-primary"
                    onError={(e) => {
                        const currentSrc = e.target.src;
                        // If it's already a proxied URL or a placeholder, don't try again
                        if (currentSrc.includes('/api/proxy/image') || currentSrc.includes('placehold.co')) {
                            e.target.onerror = null;
                            e.target.src = 'https://placehold.co/400x400/f3f4f6/374151?text=' + encodeURIComponent(title);
                            return;
                        }
                        // Try proxying
                        e.target.src = `${BACKEND_URL}/api/proxy/image?url=${encodeURIComponent(imgSrc)}`;
                    }}
                />
                {/* Secondary image (only rendered when it exists) */}
                {hasSecondImage && (
                    <img
                        src={secondImgSrc}
                        alt={`${title} - alternate`}
                        loading="lazy"
                        className="product-img-secondary"
                        onError={(e) => {
                            const currentSrc = e.target.src;
                            if (currentSrc.includes('/api/proxy/image')) {
                                e.target.style.display = 'none';
                                return;
                            }
                            // Try proxying
                            e.target.src = `${BACKEND_URL}/api/proxy/image?url=${encodeURIComponent(secondImgSrc)}`;
                        }}
                    />
                )}
                {discountPercent > 0 && (
                    <span className="badge-danger absolute top-3 right-3 text-xs font-medium px-2.5 py-1 rounded-full z-10">
                        -{discountPercent}%
                    </span>
                )}
                {recommendationScore && (
                    <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
                        <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {recommendationScore}% Match
                        </span>
                    </div>
                )}
            </div>
            <h3 className="font-bold text-sm sm:text-base line-clamp-2 mb-1" style={{ fontFamily: "'Satoshi', sans-serif" }}>
                {title}
            </h3>
            {sellerName && (
                <p style={{ fontSize: '11px', color: '#737373', marginBottom: '4px', fontWeight: 500 }}>
                    by {sellerName}
                </p>
            )}
            <div className="mb-1">
                <StarRating rating={rating} size={14} showText count={totalReviews} />
            </div>
            <div className="flex items-center gap-2.5 mt-1">
                <span className="font-bold text-lg sm:text-xl">${discountedPrice || price}</span>
                {discountPercent > 0 && price !== discountedPrice && (
                    <>
                        <span className="line-through text-sm" style={{ color: '#a3a3a3' }}>${price}</span>
                        <span className="badge-danger text-xs px-2 py-0.5 rounded-full font-medium">
                            -{discountPercent}%
                        </span>
                    </>
                )}
            </div>
        </Link>
    );
}
