"use strict"

const WebSocket = require('ws');
const net = require('net');
const fs = require('fs');
const { exec } = require('child_process');
const Block = require('./block');

class Blockchain {
  constructor(mainnet=true) {
    this.chain = [];
    this.difficulty = 4;
    this.currentTransactions = [];
    this.pendingTransactions = [];
    this.smartContracts = [];
    this.peers = [];
    this.difficulty = 2;
    this.currentNodeUrl = 'ws://localhost:3000'; // Current node URL for peer-to-peer communication
    this.networkNodes = []; // URLs of other nodes in the network
    this.server = null;
    this.mainnet = mainnet;

    if (mainnet) {
      if (fs.existsSync('blockchain_data.json') === false) {
        this.chain = [this.createGenesisBlock()];
        this.saveBlockchain();
      }
    } else {
      if (fs.existsSync('blockchain_peer_data.json') === false) {
        this.chain = [this.createGenesisBlock()];
        this.saveBlockchain();
      }
    }

    // Load blockchain from storage or initialize with genesis block
    this.loadBlockchain();
  }

  getLastIndex() {
    return this.chain.length - 1;
  }

  getNextIndex() {
    const previousBlock = this.getLatestBlock();
    let newIndex = 1;
    if (previousBlock) {
      newIndex = previousBlock.index + 1;
    }
    return newIndex;
  }
  

  loadBlockchain() {
    try {
      let data = null;
      if (this.mainnet) {
        data = fs.readFileSync('blockchain_data.json');
      } else {
        data = fs.readFileSync('blockchain_peer_data.json');
      }
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

    if (this.mainnet) {
      fs.writeFileSync('blockchain_data.json', data);
    } else {
      fs.writeFileSync('blockchain_peer_data.json', data);
    }

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

  addBlock(newBlock) {
    newBlock.previousHash = this.getLatestBlock().hash;
    newBlock.hash = newBlock.calculateHash();
    this.chain.push(newBlock);
    this.saveBlockchain();
  }

  createBlock() {
    const previousBlock = this.getLatestBlock();
    const newIndex = this.getNextIndex();
    const newTimestamp = new Date().toISOString();
    // add smart contract to the block
    this.pendingTransactions.push(...this.smartContracts);
    const newBlock = new Block(newIndex, newTimestamp, this.pendingTransactions, previousBlock.hash);
    //newBlock.mine(this.difficulty);
    //this.adjustDifficulty();
    this.chain.push(newBlock);  

    if (this.isChainValid()) {
      // Save the updated blockchain to storage
      this.adjustDifficulty();
      newBlock.mine(this.difficulty);
      this.saveBlockchain();
    } else {
      this.chain.pop();
      newBlock = null;
    }

    this.pendingTransactions = [];

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

  addSmartContract(contract) {
    this.smartContracts.push(contract);
  }


  async isChainValid(chain=[]) {
    let _chain = chain;
    if (_chain.length == 0) {
      _chain = this.chain;
    }
    for (let i = 1; i < _chain.length; i++) {
      const currentBlock = await this.chain[i];
      const previousBlock = await this.chain[i - 1];

      if (!currentBlock.validateHash()) {
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }

    return true;
  }
  
  async isValidChain(chain) {
    for (let i = 1; i < chain.length; i++) {
      const currentBlock = await chain[i].getChain();
      const previousBlock = await chain[i - 1].getChain();

      if (currentBlock.hash !== currentBlock.calculateHash() ||
          currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    return true;
  }

  getChain() {
    return this.chain;
  }

  connectToPeer(peer) {
    this.peers.push(peer);
  }

  connectToRemotePeer(ip, port) {
    const socket = net.createConnection(port, ip, () => {
      console.log(`Connected to peer at ${ip}:${port}`);
      this.peers.push(socket);
    });

    socket.on('data', data => {
      const receivedChain = JSON.parse(data);
      if (receivedChain.length > this.chain.length && this.isValidChain(receivedChain)) {
        this.chain = receivedChain;
        console.log(`Blockchain synchronized with peer at ${ip}:${port}`);
      }
    });

    socket.on('error', err => {
      console.error(`Error connecting to peer at ${ip}:${port}:`, err);
    });
  }

  broadcastChain() {
    const serializedChain = JSON.stringify(this.chain);
    this.peers.forEach(peer => {
      peer.write(serializedChain);
    });
  }

  createPeerBlockchain() {
    const peerBlockchain = new Blockchain(false);
    this.peers.push(peerBlockchain);
    peerBlockchain.syncBlockchain(this.chain);
    peerBlockchain.saveBlockchain();
    return peerBlockchain;
  }

  syncBlockchain(chain) {
    if (chain.length > this.chain.length && this.isValidChain(chain)) {
      this.chain = chain;
    }
  }

  syncPeersBlockchain() {
    this.peers.forEach(peer => {
      const peerChain = peer.getChain();
      console.log(peerChain)
      
      this.syncBlockchain(peerChain);
    });
  }


  // Other blockchain methods like validation, consensus, etc.
}

module.exports = Blockchain;