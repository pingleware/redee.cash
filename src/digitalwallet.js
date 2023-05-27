"use strict"

const fs = require('fs');
const crypto = require('crypto');
const elliptic = require('elliptic');
const base58 = require('base58');
const faye = require('faye');

// File path for storing the high-risk list
const highRiskListFilePath = 'highRiskList.json';

const owner = null;

class DigitalWallet {
    constructor(blockchain) {
        this.wallets = {};
        this.balance = 0;
        this.kycVerified = false;
        this.blockchain = blockchain;

        // Create a Faye client
        this.client = new faye.Client('http://localhost:8000/faye');

        // Load wallet data from storage or initialize with default values
        this.loadWalletData();
    }

    createWallet(name, email, balance = 0) {
        const { privateKey, publicKey, address } = this.generateKeyPair();
        this.wallets[address] = {
            name: name,
            email: email,
            privateKey: privateKey,
            publicKey: publicKey,
            balance: balance,
            kycVerified: false,
            pendingTransactions: [],
        };

        // Save the updated wallet data to storage
        this.saveWalletData();

        this.client.publish('/newWallet', { address, balance });

        return address;
    }

    importWallet(name, email, privateKeyOrpassPhrase) {
        // Generate wallet address from private key
        const walletAddress = this.generateWalletAddress(privateKeyOrpassPhrase);

        this.wallets[walletAddress] = {
            name: name,
            email: email,
            privateKey: privateKeyOrpassPhrase,
            publicKey: this.generatePublicKey(privateKeyOrpassPhrase),
            balance: Number(0),
            kycVerified: false,
            pendingTransactions: [],
        };

        // Save the updated wallet data to storage
        this.saveWalletData();

        this.client.publish('/importWallet', { walletAddress });
        return walletAddress;
    }

    /**
     * It attempts to read the wallet data from the wallet_data.json file and loads it into the walletData object. 
     * If no data is found, it initializes the wallet data with default values.
     */
    loadWalletData() {
        try {
            const data = fs.readFileSync('wallet_data.json');
            this.wallets = JSON.parse(data);
        } catch (err) {
            // Initialize with default wallet data if no data found
            this.wallets = {};
        }
    }

    /**
     * The saveWalletData() method is called whenever there is an update to the wallet, 
     * such as after the KYC verification or executing a transaction. 
     * It updates the walletData object with the current balance and KYC verification status, 
     * serializes it into JSON format, and writes it to the wallet_data.json file.
     */
    saveWalletData() {
        const data = JSON.stringify(this.wallets);
        fs.writeFileSync('wallet_data.json', data);
    }

    generateKeyPair() {
        // Generate public and private key pair for wallet address
        const privateKey = crypto.randomBytes(32).toString('hex'); 
        const publicKey = this.generatePublicKey(privateKey);
        return {
            privateKey: privateKey,
            publicKey: publicKey,
            address: this.generateWalletAddress(privateKey)
        }
    }

    generatePublicKey(privateKey) {
        // Generate public key from private key
        const curve = new elliptic.ec('secp256k1');
        const keyPair = curve.keyFromPrivate(privateKey);
        const publicKey = keyPair.getPublic('hex');
        return publicKey;
    }

    generateAddress(publicKey) {
        // Generate wallet address from public key
        const publicKeyHash = crypto.createHash('sha256').update(publicKey, 'hex').digest();
        const publicKeyHashRIPEMD160 = crypto.createHash('ripemd160').update(publicKeyHash).digest();
        const versionPrefix = Buffer.from('00', 'hex'); // Bitcoin Mainnet Address Prefix
        const extendedPayload = Buffer.concat([versionPrefix, publicKeyHashRIPEMD160]);
        const checksum = crypto.createHash('sha256').update(extendedPayload).digest();
        const doubleChecksum = crypto.createHash('sha256').update(checksum).digest();
        const addressChecksum = doubleChecksum.slice(0, 4);
        const addressBytes = Buffer.concat([extendedPayload, addressChecksum]);
        const walletAddress = base58.encode(addressBytes);
        return walletAddress;
    }

    generateWalletAddress(privateKey) {
        // Generate wallet address from private key using a cryptographic hash function
        const hash = crypto.createHash('sha256').update(privateKey).digest('hex');
        return hash;
    }

    verifyKYC(walletId) {
        // Simulate a KYC verification process
        const { KYCService } = require("./kycservice");
        const verified = KYCService.verifyIdentity(this.wallets[walletId].name, walletId);

        // Set this.kycVerified to true if KYC verification is successful
        this.wallets[walletId].kycVerified = verified;

        // Save the updated wallet data to storage
        this.saveWalletData();
    }

    createTransaction(sender, receiver, amount) {
        return {
          sender,
          receiver,
          amount,
        };
    }

    signTransaction(walletId, transactionData) {
        const sign = crypto.createSign('SHA256');
        sign.update(transactionData);
        const signature = sign.sign(this.wallet[walletId].privateKey, 'hex');
        return signature;
    }

    /**
     * Before executing the transaction, it checks if the KYC verification is complete (kycVerified is true) and 
     * performs an AML check by calling the isAMLViolated(recipient) method.
     */
    executeTransaction(sender, recipient, amount) {
        const wallet = this.wallets[recipient];
        if (!wallet) {
          console.log(`Wallet '${walletId}' does not exist.`);
          return;
        }

        // KYC verification
        const verified = KYCService.verifyIdentity(wallet.name, wallet.id);
        if (!verified) {
          console.log('KYC Verification Failed.');
          return;
        }

        // Execute the transaction using private key
        const transactionData = this.createTransaction(sender, wallet.id, amount);
        // Sign the transaction data using the private key
        const signature = this.signTransaction(sender, JSON.stringify(transactionData));

        // Execute the transaction
        const transaction = {
            data: transactionData,
            signature: signature
        };

        wallet.pendingTransactions.push(transaction);
        this.pendingTransactions.push(transaction);
        // Broadcast the transaction to the blockchain network
        this.blockchain.addTransaction(transaction)    

        // Save the updated wallet data to storage
        this.saveWalletData();

    }

    // Load the high-risk list from the JSON file
    loadHighRiskList() {
        try {
            const data = fs.readFileSync(highRiskListFilePath);
            return JSON.parse(data);
        } catch (error) {
            // Return an empty array if the file doesn't exist or there's an error reading it
            return [];
        }
    }
  
    // Save the high-risk list to the JSON file
    saveHighRiskList(highRiskList) {
        const data = JSON.stringify(highRiskList);
        fs.writeFileSync(highRiskListFilePath, data);
    }

    /**
     * The isAMLViolated(recipient) method is responsible for performing the AML check on the recipient. 
     * You can implement the necessary logic to check against AML regulations and requirements specific to your jurisdiction. 
     * If an AML violation is detected, the transaction is not allowed.
     */
    isAMLViolated(recipient) {
        // Perform AML check on the recipient
        const highRiskList = loadHighRiskList();
        // Check against the high-risk list
        const isHighRisk = highRiskList.some((individual) => {
            return (
                individual.name.toLowerCase() === recipient.name.toLowerCase() ||
                individual.id === recipient.id
            );
        });

        if (isHighRisk) {
            console.log('AML Check: High Risk Individual Detected');
            // Return true if AML violation is detected, otherwise false
            return true;
        } else {
            console.log('AML Check: No High Risk Detected');
            // Proceed with the transaction
            return false;
        }    
    }

    getBalance(walletId) {
        const wallet = this.wallets[walletId];
        if (!wallet) {
          console.log(`Wallet '${walletId}' does not exist.`);
          return;
        }

        return wallet.balance;
    }

    /**
     * When a deposit is initiated, the echange rate for GOLD to USD is obtain, and the digital currency token are calculated
     * from the exchange less fees.
     */
    /**
     * Using a third party Money Transmitter, like Stripe, to exchange USD to digital tokens.
     * 
     * @param {*} walletId recipient wallet address
     * @param {*} amount in USD to buy digital tokens
     * @param {*} fee any fee for purchasing gold from the broker
     * @returns 
     */
    deposit(walletId, amount, fee = 0) {
        const wallet = this.wallets[walletId];
        if (!wallet) {
          console.log(`Wallet '${walletId}' does not exist.`);
          return;
        }
    
        // KYC verification
        const verified = KYCService.verifyIdentity(wallet.name, wallet.id);
        if (!verified) {
          console.log('KYC Verification Failed. Deposit rejected.');
          return;
        }
    
        const totalAmount = amount + fee;
        const { computeTokenQuantity } = require("./exchange");
        wallet.balance += Number(computeTokenQuantity(amount)),toFixed(5);
        
        const transaction = this.createTransaction(walletId, owner, amount);
        wallet.pendingTransactions.push(transaction);
        this.pendingTransactions.push(transaction);
    
        if (totalAmount > 10000) {
            // Generate SAR for high-value deposits
            const { FINCENService } = require("./fincenservice");
            FINCENService.submitSAR(walletId, transaction.id);
        }    
        // Broadcast the transaction to the blockchain network
        this.blockchain.addTransaction(transaction);
        
        // purchase gold from reputable broker
        const { Gold } = require("./gold");
        Gold.purchase(totalAmount);

        this.client.publish('/deposit', { transaction });

    }

    /**
     * 
     * @param {*} walletId recipient wallet address
     * @param {*} amount is in digital currency token
     * @param {*} fee fee in USD, any fees incurred from sale of gold from broker
     * @returns 
     */
    withdraw(walletId, amount, fee = 0) {
        const wallet = this.wallets[walletId];
        if (!wallet) {
          console.log(`Wallet '${walletId}' does not exist.`);
          return;
        }

        // convert fee to digital token
        const { computeTokenQuantity } = require("./exchange");
        // get total amount of tokens required to withdraw
        const totalAmount = Number(amount + computeTokenQuantity(fee));
        if (totalAmount > wallet.balance) {
          console.log(`Insufficient funds in Wallet '${walletId}'.`);
          return;
        }
        // subtract total amount of tokens used for the withdrawal
        wallet.balance -= totalAmount;
        // convert tokens to USD
        const { computeUSD } = require("./exchange");
        var amountUSD = computeUSD(amount);
        const transaction = this.createTransaction(owner, walletId, Number(amountUSD - fee));
        wallet.pendingTransactions.push(transaction);
        this.pendingTransactions.push(transaction);

        if (amountUSD > 10000) {
            // Generate SAR for high-value deposits
            const { FINCENService } = require("./fincenservice");
            FINCENService.submitSAR(walletId, transaction.id);
        }    

        // Broadcast the transaction to the blockchain network
        this.blockchain.addTransaction(transaction);

        // sell gold to distribute cash to recipient
        const { Gold } = require("./gold");
        Gold.sell(totalAmount);

        this.client.publish('/withdraw', { transaction });

    }
    
    /**
     * Used for transfering tokens between two wallets, for example, fulfill a commerce transaction?
     * 
     * @param {*} senderId sender
     * @param {*} recipientId receipient
     * @param {*} amount number of tokens to trasnfer
     * @returns 
     */
    transfer(senderId, recipientId, amount) {
        const senderWallet = this.wallets[senderId];
        const recipientWallet = this.wallets[recipientId];
    
        if (!senderWallet) {
          console.log(`Sender wallet '${senderId}' does not exist.`);
          return;
        }
    
        if (!recipientWallet) {
          console.log(`Recipient wallet '${recipientId}' does not exist.`);
          return;
        }
    
        if (amount <= 0) {
          console.log(`Invalid transfer amount: ${amount}`);
          return;
        }
    
        if (amount > senderWallet.balance) {
          console.log(`Insufficient balance in sender wallet '${senderId}'.`);
          return;
        }
    
        // Deduct the amount from the sender's wallet
        senderWallet.balance -= amount;
    
        // Add the amount to the recipient's wallet
        recipientWallet.balance += amount;
    
        // Create transaction objects for sender and recipient
        const senderTransaction = this.createTransaction(senderId, recipientId, amount);
        const recipientTransaction = this.createTransaction(senderId, recipientId, amount);
        senderWallet.pendingTransactions.push(senderTransaction);
        recipientWallet.pendingTransactions.push(recipientTransaction);
        this.pendingTransactions.push(senderTransaction);
        this.pendingTransactions.push(recipientTransaction);

        // Broadcast the transaction to the blockchain network
        this.blockchain.addTransaction(senderTransaction);
        this.blockchain.addTransaction(recipientTransaction);

        this.client.publish('/transfer', { senderTransaction, recipientTransaction });

    }
    

    // Other wallet methods like balance inquiry, transaction history, etc.
}
  
  
module.exports = DigitalWallet;