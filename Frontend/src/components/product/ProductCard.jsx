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
    } = product;

    const imgSrc = images?.[0]?.url || 'https://placehold.co/300x300/f0f0f0/999?text=No+Image';

    return (
        <Link to={`/product/${_id}`} className="group block">
            <div className="product-img-wrap">
                <img src={imgSrc} alt={title} loading="lazy" />
                {discountPercent > 0 && (
                    <span className="badge-danger absolute top-3 right-3 text-xs font-medium px-2.5 py-1 rounded-full">
                        -{discountPercent}%
                    </span>
                )}
            </div>
            <h3 className="font-bold text-sm sm:text-base line-clamp-2 mb-1.5" style={{ fontFamily: "'Satoshi', sans-serif" }}>
                {title}
            </h3>
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
