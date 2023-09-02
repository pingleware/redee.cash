"use strict"

const mongoose = require('mongoose');

// Define the Merchant schema
const merchantSchema = new mongoose.Schema({
  name: String,
  address: String,
  city: String,
  state: String,
  zipcode: String,
  country: String,
  website: String
  // Additional fields as per your requirement
});

var Merchant;

class MerchantAPI {
  constructor(blockchain, merchantId=null) {
    this.blockchain = blockchain;
    this.merchantId = merchantId;

    if (this.merchantId) {
      async() => {
        await mongoose.connect('mongodb://localhost:27017/redee.cash', {
          useNewUrlParser: true,
          useUnifiedTopology: true
        });
        // Create the Merchant model
        Merchant = mongoose.model('Merchant', merchantSchema);
  
        Merchant.findById(this.merchantId)
        .then((merchant) => {
          if (merchant) {
            this.merchant = merchant;
            console.log('Merchant found:', this.merchant);
          } else {
            console.log('Merchant not found');
          }
        })
        .catch((error) => {
          console.error('Error retrieving merchant:', error);
        });        
      }
    }
  }

  createTransaction(fromAddress, toAddress, amount) {
    const transaction = {
      fromAddress: fromAddress,
      toAddress: toAddress,
      amount: amount,
    };
    this.blockchain.createTransaction(transaction);
  }

  processPendingTransactions(miningRewardAddress) {
    this.blockchain.minePendingTransactions(miningRewardAddress);
  }

  getBalance(address) {
    return this.blockchain.getBalanceOfAddress(address);
  }

  async addMerchant(name,address,city,state,zipcode,country,website) {
    try {
      await mongoose.connect('mongodb://localhost:27017/redee.cash', {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      // Create the Merchant model
      Merchant = mongoose.model('Merchant', merchantSchema);
      console.log('Connected to MongoDB');

      const newMerchant = new Merchant({
        name: name,
        address: address,
        city: city,
        state: state,
        zipCode: zipcode,
        country: country,
        website: website,
      });
      
      newMerchant.save()
      .then((merchant) => {
          console.log('Merchant saved:', merchant);
          return merchant;
      })
      .catch((error) => {
          console.error('Error saving merchant:', error);
      });
    } catch(error) {
      throw new Error(error.message);
    }
  }

  async verifyMerchant() {
    try {
        await mongoose.connect('mongodb://localhost:27017/redee.cash', {
          useNewUrlParser: true,
          useUnifiedTopology: true
        });
        // Create the Merchant model
        Merchant = mongoose.model('Merchant', merchantSchema);
        console.log('Connected to MongoDB');
    
        const merchant = await Merchant.findById(this.merchantId);
        return merchant;
      if (!merchant) {
        throw new Error('Merchant not found');
      }
      // Additional verification logic
    } catch (error) {
      throw new Error('Merchant verification failed');
    }
  }

  // Other methods...
}

module.exports = MerchantAPI;