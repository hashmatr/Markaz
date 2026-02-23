import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiPackage, FiImage, FiPlus, FiX } from 'react-icons/fi';
import { productAPI, categoryAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Breadcrumb from '../components/ui/Breadcrumb';

export default function EditProductPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [categories, setCategories] = useState([]);
    const [images, setImages] = useState([]);         // new File objects
    const [previews, setPreviews] = useState([]);      // blob URLs for new files
    const [existingImages, setExistingImages] = useState([]); // existing {url, public_id}

    const [form, setForm] = useState({
        title: '', description: '', price: '', quantity: '',
        category: '', brand: '', discountPercent: '0', color: '', tags: ''
    });

    const [sizes, setSizes] = useState([{ name: '', quantity: 0 }]);
    const [specs, setSpecs] = useState([{ key: '', value: '' }]);

    useEffect(() => {
        Promise.all([
            categoryAPI.getAll(),
            productAPI.getById(id),
        ]).then(([catRes, prodRes]) => {
            setCategories(catRes.data.data.categories);
            const p = prodRes.data.data.product;
            setForm({
                title: p.title || '',
                description: p.description || '',
                price: p.price?.toString() || '',
                quantity: p.quantity?.toString() || '',
                category: p.category?._id || p.category || '',
                brand: p.brand || '',
                discountPercent: p.discountPercent?.toString() || '0',
                color: p.color || '',
                tags: (p.tags || []).join(', '),
            });
            setSizes(p.sizes?.length > 0 ? p.sizes : [{ name: '', quantity: 0 }]);
            setSpecs(p.specifications?.length > 0 ? p.specifications : [{ key: '', value: '' }]);
            setExistingImages(p.images || []);
        }).catch(() => {
            toast.error('Failed to load product');
            navigate('/seller/dashboard');
        }).finally(() => setFetching(false));
    }, [id]);

    // Sizes handlers
    const addSize = () => setSizes([...sizes, { name: '', quantity: 0 }]);
    const removeSize = (index) => setSizes(sizes.filter((_, i) => i !== index));
    const updateSize = (index, field, value) => {
        const newSizes = [...sizes];
        newSizes[index][field] = value;
        setSizes(newSizes);
    };

    // Specs handlers
    const addSpec = () => setSpecs([...specs, { key: '', value: '' }]);
    const removeSpec = (index) => setSpecs(specs.filter((_, i) => i !== index));
    const updateSpec = (index, field, value) => {
        const newSpecs = [...specs];
        newSpecs[index][field] = value;
        setSpecs(newSpecs);
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (existingImages.length + images.length + files.length > 5) {
            toast.error('Maximum 5 images allowed');
            return;
        }
        setImages([...images, ...files]);
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPreviews([...previews, ...newPreviews]);
    };

    const removeNewImage = (index) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        setImages(newImages);
        const newPreviews = [...previews];
        URL.revokeObjectURL(newPreviews[index]);
        newPreviews.splice(index, 1);
        setPreviews(newPreviews);
    };

    const removeExistingImage = (index) => {
        setExistingImages(existingImages.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (existingImages.length + images.length === 0) {
            toast.error('Please have at least one image');
            return;
        }

        setLoading(true);
        const formData = new FormData();

        Object.keys(form).forEach(key => {
            if (key === 'tags') {
                formData.append('tags', form.tags.split(',').map(tag => tag.trim()).filter(Boolean));
            } else {
                formData.append(key, form[key]);
            }
        });

        const validSizes = sizes.filter(s => s.name);
        if (validSizes.length > 0) formData.append('sizes', JSON.stringify(validSizes));

        const validSpecs = specs.filter(s => s.key && s.value);
        if (validSpecs.length > 0) formData.append('specifications', JSON.stringify(validSpecs));

        // Send existing images that user kept
        formData.append('existingImages', JSON.stringify(existingImages));

        images.forEach(image => formData.append('images', image));

        try {
            await productAPI.update(id, formData);
            toast.success('Product updated successfully!');
            navigate('/seller/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update product');
        } finally {
            setLoading(false);
        }
    };

    if (!user || user.role !== 'SELLER') {
        return (
            <div className="container-main" style={{ paddingTop: '64px', paddingBottom: '64px', textAlign: 'center' }}>
                <h2 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: '28px', fontWeight: 700 }}>ACCESS DENIED</h2>
                <p style={{ color: '#737373', marginTop: '16px' }}>You need a seller account to access this page.</p>
            </div>
        );
    }

    if (fetching) {
        return (
            <div className="container-main" style={{ paddingTop: '64px', paddingBottom: '64px', textAlign: 'center' }}>
                <div style={{ width: 40, height: 40, border: '3px solid #e5e5e5', borderTop: '3px solid #000', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                <p style={{ marginTop: 16, color: '#737373' }}>Loading product...</p>
            </div>
        );
    }

    return (
        <div className="container-main" style={{ paddingTop: '24px', paddingBottom: '48px' }}>
            <Breadcrumb items={[{ label: 'Seller Dashboard', link: '/seller/dashboard' }, { label: 'Edit Product' }]} />

            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h1 style={{ fontFamily: "'Integral CF', sans-serif", fontSize: '32px', fontWeight: 700, marginBottom: '32px' }}>EDIT PRODUCT</h1>

                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '24px' }}>
                    {/* Basic Info Section */}
                    <div style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '24px', padding: '32px', display: 'grid', gap: '20px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>BASIC INFORMATION</h3>

                        <div>
                            <label style={{ marginBottom: '8px', display: 'block', fontWeight: 600, fontSize: '14px' }}>Product Title *</label>
                            <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="form-input" />
                        </div>

                        <div>
                            <label style={{ marginBottom: '8px', display: 'block', fontWeight: 600, fontSize: '14px' }}>Description *</label>
                            <textarea required rows={5} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="form-input" style={{ height: 'auto', resize: 'vertical' }} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label style={{ marginBottom: '8px', display: 'block', fontWeight: 600, fontSize: '14px' }}>Price ($) *</label>
                                <input type="number" step="0.01" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="form-input" />
                            </div>
                            <div>
                                <label style={{ marginBottom: '8px', display: 'block', fontWeight: 600, fontSize: '14px' }}>Stock Quantity *</label>
                                <input type="number" required value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="form-input" />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label style={{ marginBottom: '8px', display: 'block', fontWeight: 600, fontSize: '14px' }}>Category *</label>
                                <select required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="form-input" style={{ cursor: 'pointer' }}>
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ marginBottom: '8px', display: 'block', fontWeight: 600, fontSize: '14px' }}>Brand (Optional)</label>
                                <input type="text" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} className="form-input" />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label style={{ marginBottom: '8px', display: 'block', fontWeight: 600, fontSize: '14px' }}>Discount Percent (%)</label>
                                <input type="number" min="0" max="100" value={form.discountPercent} onChange={e => setForm({ ...form, discountPercent: e.target.value })} className="form-input" />
                            </div>
                            <div>
                                <label style={{ marginBottom: '8px', display: 'block', fontWeight: 600, fontSize: '14px' }}>Product Color</label>
                                <input type="text" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="form-input" />
                            </div>
                        </div>
                    </div>

                    {/* Variations & Filters Section */}
                    <div style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '24px', padding: '32px', display: 'grid', gap: '24px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 700 }}>VARIATIONS & SPECIFICATIONS</h3>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <label style={{ fontWeight: 600, fontSize: '14px' }}>Sizes</label>
                                <button type="button" onClick={addSize} style={{ color: '#000', fontSize: '12px', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>+ Add Size</button>
                            </div>
                            <div style={{ display: 'grid', gap: '12px' }}>
                                {sizes.map((size, index) => (
                                    <div key={index} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <input type="text" placeholder="Size" value={size.name} onChange={e => updateSize(index, 'name', e.target.value)} className="form-input" style={{ flex: 2 }} />
                                        <input type="number" placeholder="Qty" value={size.quantity} onChange={e => updateSize(index, 'quantity', e.target.value)} className="form-input" style={{ flex: 1 }} />
                                        {sizes.length > 1 && (
                                            <button type="button" onClick={() => removeSize(index)} style={{ color: '#ff3333', cursor: 'pointer', background: 'none', border: 'none' }}><FiX size={18} /></button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <label style={{ fontWeight: 600, fontSize: '14px' }}>Specifications</label>
                                <button type="button" onClick={addSpec} style={{ color: '#000', fontSize: '12px', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>+ Add Spec</button>
                            </div>
                            <div style={{ display: 'grid', gap: '12px' }}>
                                {specs.map((spec, index) => (
                                    <div key={index} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <input type="text" placeholder="Field" value={spec.key} onChange={e => updateSpec(index, 'key', e.target.value)} className="form-input" style={{ flex: 1 }} />
                                        <input type="text" placeholder="Value" value={spec.value} onChange={e => updateSpec(index, 'value', e.target.value)} className="form-input" style={{ flex: 1 }} />
                                        {specs.length > 1 && (
                                            <button type="button" onClick={() => removeSpec(index)} style={{ color: '#ff3333', cursor: 'pointer', background: 'none', border: 'none' }}><FiX size={18} /></button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label style={{ marginBottom: '8px', display: 'block', fontWeight: 600, fontSize: '14px' }}>Tags (comma separated)</label>
                            <input type="text" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className="form-input" />
                        </div>
                    </div>

                    {/* Image Section */}
                    <div style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '24px', padding: '32px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>PRODUCT IMAGES</h3>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                            {/* Existing images */}
                            {existingImages.map((img, index) => (
                                <div key={`existing-${index}`} style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #10b981' }}>
                                    <img src={img.url} alt="Product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <button type="button" onClick={() => removeExistingImage(index)}
                                        style={{ position: 'absolute', top: '4px', right: '4px', backgroundColor: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer', display: 'flex' }}>
                                        <FiX size={14} />
                                    </button>
                                </div>
                            ))}

                            {/* New image previews */}
                            {previews.map((preview, index) => (
                                <div key={`new-${index}`} style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #3b82f6' }}>
                                    <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <button type="button" onClick={() => removeNewImage(index)}
                                        style={{ position: 'absolute', top: '4px', right: '4px', backgroundColor: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer', display: 'flex' }}>
                                        <FiX size={14} />
                                    </button>
                                </div>
                            ))}

                            {existingImages.length + images.length < 5 && (
                                <label style={{ width: '100px', height: '100px', borderRadius: '12px', border: '2px dashed #e5e5e5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#737373' }}>
                                    <input type="file" multiple accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                                    <FiPlus size={24} />
                                    <span style={{ fontSize: '10px', marginTop: '4px' }}>Upload</span>
                                </label>
                            )}
                        </div>
                        <p style={{ fontSize: '11px', color: '#a3a3a3', marginTop: '12px' }}>
                            <span style={{ color: '#10b981' }}>Green border</span> = existing images | <span style={{ color: '#3b82f6' }}>Blue border</span> = newly added
                        </p>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={() => navigate('/seller/dashboard')} className="btn-secondary" style={{ padding: '16px 32px' }}>Cancel</button>
                        <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '16px 32px' }}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
