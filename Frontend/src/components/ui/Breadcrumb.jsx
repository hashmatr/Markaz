import { Link } from 'react-router-dom';
import { FiChevronRight } from 'react-icons/fi';

export default function Breadcrumb({ items = [] }) {
    return (
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <Link to="/" style={{ color: '#a3a3a3', transition: 'color 0.2s' }}>Home</Link>
            {items.map((item, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiChevronRight size={14} style={{ color: '#a3a3a3' }} />
                    {item.to ? (
                        <Link to={item.to} style={{ color: '#a3a3a3', transition: 'color 0.2s' }}>{item.label}</Link>
                    ) : (
                        <span style={{ color: '#000', fontWeight: 500 }}>{item.label}</span>
                    )}
                </span>
            ))}
        </nav>
    );
}
