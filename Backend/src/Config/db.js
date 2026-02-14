const mongoose = require('mongoose');

const connectDb = async () => {
    try {
        const conn = await mongoose.connect(process.env.mongodb_url);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.log(`MongoDB connection error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDb;