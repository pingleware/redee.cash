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

// Create the Merchant model
const Merchant = mongoose.model('Merchant', merchantSchema);

class MerchantAPI {
  constructor(blockchain, merchantId) {
    this.blockchain = blockchain;
    this.merchantId = merchantId;
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

  async verifyMerchant() {
    try {
        await mongoose.connect('mongodb://localhost:27017/redee.cash', { useNewUrlParser: true });
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