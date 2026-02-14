const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../Config/cloudinary');

// Cloudinary storage for product images
const productStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'markaz_products',
    },
});

// Cloudinary storage for avatars
const avatarStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'markaz_avatars',
    },
});

// Cloudinary storage for store logos/banners
const storeStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'markaz_stores',
    },
});

// Cloudinary storage for category images
const categoryStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'markaz_categories',
    },
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only .jpeg, .jpg, .png, and .webp files are allowed'), false);
    }
};

// Upload middlewares
const uploadProductImages = multer({
    storage: productStorage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).array('images', 5);

const uploadAvatar = multer({
    storage: avatarStorage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
}).single('avatar');

const uploadStoreLogo = multer({
    storage: storeStorage,
    fileFilter,
    limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
}).single('storeLogo');

const uploadStoreBanner = multer({
    storage: storeStorage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single('storeBanner');

const uploadCategoryImage = multer({
    storage: categoryStorage,
    fileFilter,
    limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
}).single('image');

module.exports = {
    uploadProductImages,
    uploadAvatar,
    uploadStoreLogo,
    uploadStoreBanner,
    uploadCategoryImage,
};
