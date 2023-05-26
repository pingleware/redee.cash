"use strict"

const fs = require('fs');
const { exec } = require('child_process');
const Block = require('./block');

class Blockchain {
  constructor() {
    this.chain = [];
    this.difficulty = 4;
    this.currentTransactions = [];
    this.pendingTransactions = [];

    if (fs.existsSync('blockchain_data.json') === false) {
        this.chain = [this.createGenesisBlock()];
        this.saveBlockchain();
    }

    // Load blockchain from storage or initialize with genesis block
    this.loadBlockchain();
  }

  loadBlockchain() {
    try {
      const data = fs.readFileSync('blockchain_data.json');
      const { chain, currentTransactions } = JSON.parse(data);

      this.chain = chain;
      this.currentTransactions = currentTransactions;
    } catch (err) {
      // Initialize with the genesis block if no blockchain data found
      this.createBlock();
    }
  }

  saveBlockchain() {
    const data = JSON.stringify({
      chain: this.chain,
      currentTransactions: this.currentTransactions,
    });

    fs.writeFileSync('blockchain_data.json', data);

    // Invoke the commit_to_github.sh script
    exec('./commit_to_github.sh', (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing commit_to_github.sh: ${error}`);
          return;
        }
        console.log(`Commit to GitHub successful. Output: ${stdout}`);
    });
  }

  createGenesisBlock() {
    return new Block(0, new Date().toISOString(), 'Genesis Block', '0');
  }

  createBlock() {
    const previousBlock = this.getLatestBlock();
    const newIndex = previousBlock.index + 1;
    const newTimestamp = new Date().toISOString();
    const newBlock = new Block(newIndex, newTimestamp, this.pendingTransactions, previousBlock.hash);
    //newBlock.mine(this.difficulty);
    //this.adjustDifficulty();
    this.chain.push(newBlock);  
    this.pendingTransactions = [];

    // Save the updated blockchain to storage
    this.saveBlockchain();

    return newBlock;
  }

  adjustDifficulty() {
    const lastBlock = this.chain[this.chain.length - 1];
    const timeDifference = lastBlock.timestamp - this.chain[this.chain.length - 2].timestamp;

    if (timeDifference > 5000) {
      this.difficulty--;
    } else {
      this.difficulty++;
    }
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addTransaction(transaction) {
    this.pendingTransactions.push(transaction);
    this.createBlock();    
  }


  // Other blockchain methods like validation, consensus, etc.
}

module.exports = Blockchain;