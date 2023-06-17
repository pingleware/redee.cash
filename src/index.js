"use strict"

const http = require('http');
const faye = require('faye');

// Create a new HTTP server
const server = http.createServer();

// Attach the Faye server to the HTTP server
const bayeux = new faye.NodeAdapter({ mount: '/faye', timeout: 45 });

bayeux.attach(server);

// Start the server on port 8000
server.listen(8000, () => {
  console.log('Faye server started on port 8000');
});

/**
 * Digital Currency blockchain API
 */
const express = require('express');

class CurrencyAPI {
  constructor(blockchain, wallet) {
    this.blockchain = blockchain;
    this.wallet = wallet;
    this.router = express.Router();

    // Define the API routes
    this.router.get('/blocks', this.getBlocks);
    this.router.get('/transactions', this.getTransactions);
    this.router.post('/transaction', this.createTransaction);
    this.router.get('/balance', this.getBalance);
    this.router.post('/wallet', this.createWallet);
    this.router.post('/wallet/import', this.importWallet);
    this.router.post('/deploy/contract', this.deployContract);
    this.router.post('/execute/contract', this.executeContract);

    this.router.get('/quotes', (req, res) => {
      let parValue = 5.00;
      const maxCommodityShares = 250000000;
      let marketCap = maxCommodityShares * parValue;


      const goldPrice = 1969.45; // The current price of gold
      const silverPrice = 24.42; // The current price of silver

      let totalGoldTokensIssued = (100000 * goldPrice);
      let totalSilverTokensIssued = (10000000 * silverPrice); 

      let goldTokenPrice =  Math.max(goldPrice, parValue, marketCap / totalGoldTokensIssued);
      let silverTokenPrice = Math.max(silverPrice, parValue, marketCap / totalSilverTokensIssued);

      let totalTokensIssued = totalGoldTokensIssued + totalSilverTokensIssued;

      
      while (goldTokenPrice < parValue && totalGoldTokensIssued <= totalTokensIssued) {
        // Increase the total tokens issued by a certain factor (e.g., 10%)
        totalGoldTokensIssued *= 1.1;
      
        // Recalculate the token price
        goldTokenPrice =  Math.max(goldPrice, parValue, marketCap / totalGoldTokensIssued);
      }

      totalTokensIssued = totalGoldTokensIssued + totalSilverTokensIssued;

      while (silverTokenPrice < parValue && totalSilverTokensIssued <= totalTokensIssued) {
        // Increase the total tokens issued by a certain factor (e.g., 10%)
        totalSilverTokensIssued *= 1.1;
      
        // Recalculate the token price
        silverTokenPrice = Math.max(silverPrice, parValue, marketCap / totalSilverTokensIssued);
      }
      
      res.json({
        token: {
          gold: {
            price: goldTokenPrice.toFixed(2),
            issued: totalGoldTokensIssued.toFixed(0)
          },
          silver: {
            price: silverTokenPrice.toFixed(2),
            issued: totalSilverTokensIssued.toFixed(0)
          },
          total: totalTokensIssued
        },
        gold: goldPrice.toFixed(2),
        silver: silverPrice.toFixed(2),
        parValue: parValue.toFixed(2)
      })
    })
  }

  getBlocks = (req, res) => {
    res.json(this.blockchain.chain);
  }

  getTransactions = (req, res) => {
    res.json(this.blockchain.pendingTransactions);
  }

  createTransaction = (req, res) => {
    const { sender, recipient, amount } = req.body;

    try {
      const transaction = this.wallet.createTransaction(sender, recipient, amount);
      this.blockchain.addTransaction(transaction);
      res.json(transaction);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  getBalance = (req, res) => {
    const balance = this.wallet.getBalance(req.query.address);
    res.json({ balance });
  }

  createWallet = (req, res) => {
    var address = this.wallet.createWallet(req.body.name,req.body.email,req.body.balance); 
    res.json({ address });
  }

  importWallet = (req, res) => {
    var address = this.wallet.importWallet(req.body.name,req.body.email,req.body.privateKey);
    res.json({ address });
  }

  deployContract = (req, res) => {
    const { contractCode } = req.body;

    // Deploy the smart contract
    this.smartContract = new SmartContract(contractCode);

    res.json({ message: 'Smart contract deployed successfully.' });
  }

  executeContract = (req, res) => {
    const { contractContext } = req.body;

    // Execute the smart contract
    try {
      const contractResult = this.smartContract.execute(contractContext);
      res.json({ result: contractResult });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  start(port) {
    const app = express();
    app.use(express.json());
    app.use('/api', this.router);

    app.listen(port, () => {
      console.log(`Currency API server started on port ${port}`);
    });
  }
}

// Example usage
const Blockchain = require("./blockchain");
const DigitalWallet = require("./digitalwallet");

const blockchain = new Blockchain();
const wallet = new DigitalWallet(blockchain);
const currencyAPI = new CurrencyAPI(blockchain, wallet);
currencyAPI.start(3000);

module.exports = currencyAPI

const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  });

  mainWindow.loadFile('views/index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
