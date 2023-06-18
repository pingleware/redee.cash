"use strict"

const Block = require('../block');
const Blockchain = require('../blockchain');

// Usage example
const blockchain = new Blockchain();

// Create and add blocks to the local blockchain
blockchain.addBlock(new Block(blockchain.getNextIndex(), new Date().toISOString(), { data: 'Block 1' }));
blockchain.addBlock(new Block(blockchain.getNextIndex(), new Date().toISOString(), { data: 'Block 2' }));

// Create a peer blockchain and sync with the main blockchain
const peerBlockchain = blockchain.createPeerBlockchain();
peerBlockchain.addBlock(new Block(peerBlockchain.getNextIndex(), new Date().toISOString(), { data: 'Block 1 from Peer' }));
peerBlockchain.addBlock(new Block(peerBlockchain.getNextIndex(), new Date().toISOString(), { data: 'Block 2 from Peer' }));


// Verify the peer blockchain
console.log(peerBlockchain.chain);

// Connect to the peer and sync the blockchain
blockchain.connectToPeer(peerBlockchain);
blockchain.syncPeersBlockchain();
blockchain.saveBlockchain();

// Verify the updated blockchain
console.log(blockchain.chain);
