/**
 * SEO Component - React 19 native metadata support
 * React 19 automatically hoists <title>, <meta>, and <link> tags to <head>.
 * No third-party library (react-helmet-async) needed.
 */
const SEO = ({
    title,
    description,
    image,
    article,
    url,
    type = 'website',
    schemaData = null,
    noIndex = false
}) => {
    const siteName = 'Markaz';
    const defaultTitle = 'Markaz | Online Shopping in Pakistan';
    const defaultDescription = 'Shop electronics, fashion, home essentials and more at Markaz. Best prices and fastest delivery in Pakistan.';
    const defaultImage = `${window.location.origin}/logo.png`;
    const canonUrl = (url || window.location.href).toLowerCase();

    // Sanitize and trim title (limit to 60 chars)
    const seoTitle = title
        ? (title.length > 60 ? `${title.substring(0, 57)}...` : title)
        : defaultTitle;

    // Sanitize and trim description (150-160 chars)
    let seoDescription = description || defaultDescription;
    if (seoDescription.length > 160) {
        seoDescription = `${seoDescription.substring(0, 157)}...`;
    } else if (seoDescription.length < 50 && description) {
        seoDescription = `${description}. ${defaultDescription}`.substring(0, 160);
    }

    const seoImage = image || defaultImage;

    return (
        <>
            {/* React 19 natively hoists these to <head> */}
            <title>{seoTitle}</title>
            <meta name="description" content={seoDescription} />
            <link rel="canonical" href={canonUrl} />
            {noIndex && <meta name="robots" content="noindex, follow" />}

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={seoTitle} />
            <meta property="og:description" content={seoDescription} />
            <meta property="og:image" content={seoImage} />
            <meta property="og:url" content={canonUrl} />
            <meta property="og:site_name" content={siteName} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={seoTitle} />
            <meta name="twitter:description" content={seoDescription} />
            <meta name="twitter:image" content={seoImage} />

            {/* JSON-LD Structured Data */}
            {schemaData && (
                Array.isArray(schemaData) ? (
                    schemaData.map((data, idx) => (
                        <script key={idx} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
                    ))
                ) : (
                    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }} />
                )
            )}
        </>
    );
};

export default SEO;
