"use strict"

const Block = require('../block');
const Blockchain = require('../blockchain');
const Merchant = require('../merchant');

// Usage example
const blockchain = new Blockchain();


const merchant = new Merchant(blockchain);
async() => {
    const _merchant = await merchant.addMerchant("PINGLEWARE","PO BOX 142814","GAINESILLE","FL","32618=2418","US","https://pingleware.work");
    console.log(_merchant)    
}
