import { useState } from 'react';
import { Link } from 'react-router-dom';
import StarRating from '../ui/StarRating';

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
    } = product;

    const [hovered, setHovered] = useState(false);

    const imgSrc = images?.[0]?.url || 'https://placehold.co/300x300/f0f0f0/999?text=No+Image';
    const hasSecondImage = images?.length > 1 && images[1]?.url;
    const secondImgSrc = hasSecondImage ? images[1].url : null;
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
                />
                {/* Secondary image (only rendered when it exists) */}
                {hasSecondImage && (
                    <img
                        src={secondImgSrc}
                        alt={`${title} - alternate`}
                        loading="lazy"
                        className="product-img-secondary"
                    />
                )}
                {discountPercent > 0 && (
                    <span className="badge-danger absolute top-3 right-3 text-xs font-medium px-2.5 py-1 rounded-full">
                        -{discountPercent}%
                    </span>
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
