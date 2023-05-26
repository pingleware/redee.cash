"use strict"

const crypto = require('crypto');

class Block {
    constructor(index, timestamp, data, previousHash = '') {
        this.index = index;
        this.timestamp = timestamp;
        this.data = data;
        this.previousHash = previousHash;
        this.nonce = 0;
        this.hash = this.calculateHash();
      }
    
      calculateHash() {
        const data = this.index + this.timestamp + JSON.stringify(this.data) + this.previousHash + this.nonce;
        const hash = crypto.createHash('sha256').update(data).digest('hex');
        return hash;
      }
}

module.exports = Block;