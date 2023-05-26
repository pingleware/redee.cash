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