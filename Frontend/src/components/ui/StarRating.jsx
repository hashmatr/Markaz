import { FiStar } from 'react-icons/fi';
import { FaStar, FaStarHalfAlt } from 'react-icons/fa';

export default function StarRating({ rating = 0, size = 16, showText = false, count = 0 }) {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;

    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            stars.push(<FaStar key={i} size={size} className="star-filled" />);
        } else if (i === fullStars && hasHalf) {
            stars.push(<FaStarHalfAlt key={i} size={size} className="star-filled" />);
        } else {
            stars.push(<FiStar key={i} size={size} className="star-empty" />);
        }
    }

    return (
        <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5">{stars}</div>
            {showText && (
                <span className="text-sm ml-1" style={{ color: '#737373' }}>
                    {rating.toFixed(1)}/{count > 0 ? count : '5'}
                </span>
            )}
        </div>
    );
}
