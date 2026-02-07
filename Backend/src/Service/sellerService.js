const jwtprovider = require("../utils/jwtprovider");
const seller = require("../Modal/seller");

class SellerService {

        async createSeller(sellerData){

        const existingSeller = await seller.sellerData.findOne({ email: sellerData.email });

        if (existingSeller) {

            throw new Error("Seller with this email already exists");
        }

        let savedAddress = sellerData.pickupAddress;
        savedAddress = await Address.create(sellerData.pickupAddress);
        
        const newSeller = new seller({
            sellerName: sellerData.sellerName,
            email: sellerData.email,
            phoneNumber: sellerData.phoneNumber,
            pickupAddress: savedAddress._id,
            GSTNumber: sellerData.gstNumber,
            password: sellerData.password,
            bankDetails: sellerData.bankDetails,
            businessDetails: sellerData.businessDetails
        })
        return await newSeller.save();
    }

      async getSellerProfile(jwt){
        const email = await jwtprovider.getemailfromjwttoken(jwt);
        return this.getSellerByEmail(email);
    }


    async getSellerByEmail(email){
        const seller = await seller.findOne({ email});

        if(!seller){
            throw new Error("Seller not found");
        }
        return seller;
    }

 async getSellersById(id){
    const seller = await seller.findOne({id});
    if(!seller){
        throw new Error("Seller not found");
    }
    return seller;
 }

 async getAllSellers(status){
    return await seller.find({accountstatus: status });
 }

async updateSeller(existingSeller, sellerData){
    return await seller.findByIdAndUpdate(existingSeller._id, sellerData, { new: true });
}

async updateSellerStatus(sellerId, status){
    const updatedSeller = await seller.findByIdAndUpdate(sellerId, { $set: { accountStatus: status } }, { new: true });
}

async deleteSeller(id){
    const deletedSeller = await seller.findByIdAndDelete(id);
}   
}
module.exports = new SellerService();