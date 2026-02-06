const_url = process.env.mongodb_url
const mongoose = require('mongoose')
const connectDb = async()=>{
    try {

        const conn = await mongoose.connect(const_url);
        console.log(`mongodb connected, ${conn.connection.host}`);

    } catch (error) {

        console.log(`mongodb error, ${error}`);

    }
}
module.exports = connectDb;