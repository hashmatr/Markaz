const mongoose = require('mongoose');
const FlashSale = require('../Modal/FlashSale');
require('dotenv').config({ path: '../../.env' });

const initFlashSale = async () => {
    try {
        await mongoose.connect(process.env.mongodb_url || 'mongodb://localhost:27017/markaz');
        console.log('Connected to MongoDB');

        const existingPermanent = await FlashSale.findOne({ isPermanent: true });
        console.log('Searching for existing permanent flash sale...');
        if (!existingPermanent) {
            console.log('None found. Creating new permanent flash sale...');
            await FlashSale.create({
                title: 'Mega Flash Sale (Always On)',
                description: 'Participate in our ongoing flash sale to boost your sales!',
                products: [],
                startTime: new Date(),
                endTime: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000), // 100 years
                isPermanent: true,
                isActive: true,
                bannerColor: '#ef4444',
                bannerGradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
            });
            console.log('Permanent Flash Sale created successfully');
        } else {
            console.log('Permanent Flash Sale already exists');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error creating permanent flash sale:', err);
        process.exit(1);
    }
};

initFlashSale();
