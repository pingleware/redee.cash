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

const { JSONRPCServer } = require("json-rpc-2.0");

const vm = require('vm');

let exchangeTokenHoldings = 0;
let exchangeGoldHoldings = 0;
let exchangeSilverHoldings = 0;
let exchangeQuartzHoldings = 0;
let totalTokenSupply = 0;
let totalGoldSupply = 0;
let totalSilverSupply = 0;
let totalQuartzSupply = 0;

class CurrencyAPI {
  constructor(blockchain, wallet) {
    this.blockchain = blockchain;
    this.wallet = wallet;
    this.router = express.Router();
    this.ethereum = express.Router();
    this.jsonrpc_server = new JSONRPCServer();

    // Define the methods for the JSON-RPC server
    /**
     * Sure! Here is a list of some commonly used Ethereum JSON-RPC methods:
     * 
     * 1. **eth_blockNumber**: Returns the number of the most recent block.
     * 2. **eth_getBlockByNumber**: Returns information about a specific block based on its number.
     * 3. **eth_getBlockByHash**: Returns information about a specific block based on its hash.
     * 4. **eth_getTransactionByHash**: Returns information about a specific transaction based on its hash.
     * 5. **eth_getTransactionReceipt**: Returns the receipt of a specific transaction.
     * 6. **eth_getBalance**: Returns the balance of an address at a specific block.
     * 7. **eth_getCode**: Returns the bytecode at a specific address.
     * 8. **eth_getStorageAt**: Returns the value of a specific storage position at a specific address.
     * 9. **eth_sendTransaction**: Sends a new transaction to the network.
     * 10. **eth_call**: Executes a new message call immediately without creating a transaction on the blockchain.
     * 11. **eth_estimateGas**: Estimates the gas required for a specific transaction.
     * 12. **eth_getLogs**: Returns an array of logs that match the specified filter criteria.
     * 
     * These are just a few examples of the Ethereum JSON-RPC methods available. The full list of methods can be found in the Ethereum JSON-RPC documentation. 
     * It's worth noting that different Ethereum clients or versions may support additional or modified methods, so it's important to consult the specific 
     * documentation for the Ethereum client you are using.
     */
    // See https://github.com/pingleware/private-ethereum/tree/master
    /**
     * Namespace: eth
     */
    this.jsonrpc_server.addMethod('eth_subscribe', (data) => {return data});
    this.jsonrpc_server.addMethod('eth_unsubscribe', (data) => {return data});
    this.jsonrpc_server.addMethod('eth_blockNumber', () => {
      const block = blockchain.getLatestBlock()
      return `0x${block.index.toString(16)}`;
    });
    this.jsonrpc_server.addMethod('eth_getBlockByNumber', (data) => {
      const chain = this.blockchain.getChain();
      let found = false;
      let _block = null;
      chain.forEach(function(block){
        if (Number(block.index) == Number(data[0].toString(10))) {
          _block = block;
          found = true;
        }
      })
      if (found) {
        return _block;
      }
      throw new Error(`block ${data[0]} not found`);
    });
    this.jsonrpc_server.addMethod('eth_getBlockByHash',  (data) => {
      const chain = this.blockchain.getChain();
      let found = false;
      let _block = null;
      chain.forEach(function(block){
        if (block.hash === data[0]) {
          _block = block;
          found = true;
        }
      })
      if (found) {
        return _block;
      }
      throw new Error(`block ${data[0]} not found`);
    });
    this.jsonrpc_server.addMethod('eth_getTransactionByHash', (data) => {return data});
    this.jsonrpc_server.addMethod('eth_getTransactionReceipt', (data) => {return data});
    this.jsonrpc_server.addMethod('eth_getBalance', (data) => {
      const DigitalWallet = require('./digitalwallet');
      const wallets = new DigitalWallet(this.blockchain);
      const balance = (wallets.getBalance(data[0]) * Math.pow(10,5)).toString(16);
      return `0x${balance}`;
    });
    this.jsonrpc_server.addMethod('eth_getCode', (data) => {return data});
    this.jsonrpc_server.addMethod('eth_getStorageAt', (data) => {return data});
    this.jsonrpc_server.addMethod('eth_sendTransaction', (data) => {return data});
    this.jsonrpc_server.addMethod('eth_sendRawTransaction', (data) => {
      const latestBlock = this.blockchain.getLatestBlock();
      const Block = require('./block');
      const index = latestBlock.index + 1;
      const newBlock = new Block(index,new Date().toISOString(),data);
      blockchain.addBlock(newBlock);
      return newBlock;
    });
    this.jsonrpc_server.addMethod('eth_call', (data) => {
      const contract = data[0].to;
      const className = this.hexToAscii(data[0].data);
      const funcount = data.length - 1;
      let funcname = [];
      let _arguments = [];
      for(var i=1; i<funcount; i++) {
        _arguments.push(data[2].args[i]);
        funcname.push(this.hexToAscii(data[1].data[i]))
      }
      const chain = this.blockchain.getChain();
      let code = "";
      chain.forEach(function(block){
        if (block.hash == contract) {
          code = block.data[0];
        }
      })
      if (code.length > 0) {
        try {
          const sandbox = {};
          const script = new vm.Script(atob(code));
          const context = new vm.createContext(sandbox);
        
          script.runInContext(context);
          // Access the instantiated class from the context
          const MyClass = context.MyContract;

          // Create an instance of the class
          const instance = new MyClass();

          var results = [];
          funcname.forEach(function(functionName, index){
            const charArray = _arguments[index].split(",");
            console.log([functionName,charArray]);
            var result = instance[functionName](...charArray);  
            results.push(result);
          })
          return results;  
        } catch(error) {
          throw new Error(`Error loading class or invoking function: ${error}`);
        }
      } else {
        throw new Error(`contract code not found for ${contract}`);
      }
    });
    this.jsonrpc_server.addMethod('eth_estimateGas', (data) => {return Number(0)});
    this.jsonrpc_server.addMethod('eth_getLogs', (data) => {return data});


    this.jsonrpc_server.addMethod('eth_ascii2hex', (data) => {
      return this.asciiToHex(data[0]);
    })

    /**
     * Namespace: personal
     */
    this.jsonrpc_server.addMethod('personal_importRawKey', (data) => {
      const DigitalWallet = require('./digitalwallet');
      const wallet = new DigitalWallet(this.blockchain);
      return wallet.importWallet(data[1],data[2],data[3],data[0]);
    });
    this.jsonrpc_server.addMethod('personal_listAccounts', (data) => {
      const DigitalWallet = require('./digitalwallet');
      const wallet = new DigitalWallet(this.blockchain);
      const wallets = wallet.getWallets();
      var accounts = Object.keys(wallets);
      return accounts;
    });
    this.jsonrpc_server.addMethod('personal_lockAccount', (data) => {return data});
    this.jsonrpc_server.addMethod('personal_passphrase', (data) => {
      const bip39 = require('bip39');
      const mnemonic = bip39.generateMnemonic(128); // 128 bits of entropy for a 12-word phrase
      return mnemonic.split(' ');
    });
    this.jsonrpc_server.addMethod('personal_newAccount', (data) => {
      const ethUtil = require('ethereumjs-util');
      const crypto = require('crypto');
      const passphrase = data[0];
      const privateKeyBuffer = Buffer.from(passphrase);
      const privateKeyHex = privateKeyBuffer.toString('hex');      
      const privateKey = ethUtil.addHexPrefix(privateKeyHex);
      const DigitalWallet = require('./digitalwallet');
      const wallet = new DigitalWallet(this.blockchain);
      return wallet.importWallet("UNKNOWN USER","unknown@email.com","gold",privateKey);
    });

    this.jsonrpc_server.addMethod('personal_unlockAccount', (data) => {return data});
    this.jsonrpc_server.addMethod('personal_sendTransaction', (data) => {return data});
    this.jsonrpc_server.addMethod('personal_sign', (data) => {return data});
    this.jsonrpc_server.addMethod('personal_ecRecover', (data) => {return data});


    /**
     * Namespace: parity
     */
    this.jsonrpc_server.addMethod('parity_chainStatus', (data) => {return data}); //: Retrieves the status information about the blockchain.
    this.jsonrpc_server.addMethod('parity_enode', (data) => {return data}); //: Retrieves the enode URL of the current node.
    this.jsonrpc_server.addMethod('parity_netPeers', (data) => {return data}); //: Retrieves information about the connected peers.
    this.jsonrpc_server.addMethod('parity_versionInfo', (data) => {return data}); //: Retrieves information about the Parity client version.
    this.jsonrpc_server.addMethod('parity_listAccounts', (data) => {return data}); //: Lists all accounts owned by the client.
    this.jsonrpc_server.addMethod('parity_newAccountFromPhrase', (data) => {return data}); //: Creates a new account using a passphrase.
    this.jsonrpc_server.addMethod('parity_getBalance', (data) => {return data}); //: Retrieves the balance of an account.
    this.jsonrpc_server.addMethod('parity_setAccountMeta', (data) => {return data}); //: Sets metadata for an account.
    this.jsonrpc_server.addMethod('parity_setAccountName', (data) => {return data}); //: Sets a name for an account.
    this.jsonrpc_server.addMethod('parity_importGethAccounts', (data) => {return data}); //: Imports accounts from a Geth keystore.
    this.jsonrpc_server.addMethod('parity_importRawTransaction', (data) => {return data}); //: Imports a raw, signed transaction.
    this.jsonrpc_server.addMethod('parity_importTokens', (data) => {return data}); //: Imports a list of tokens.
    this.jsonrpc_server.addMethod('parity_postTransaction', (data) => {return data}); //: Sends a signed transaction.
    this.jsonrpc_server.addMethod('parity_pendingTransactions', (data) => {return data}); //: Retrieves a list of pending transactions.
    this.jsonrpc_server.addMethod('parity_killAccount', (data) => {
      const DigitalWallet = require('./digitalwallet');
      const wallet = new DigitalWallet(this.blockchain);
      wallet.removeWallet(data[0]);
      return `Wallet ${data[0]} removed successfully`;
    }); //: Deletes an account.
    this.jsonrpc_server.addMethod('parity_revertToSnapshot', (data) => {return data}); //: Reverts the blockchain to a previous snapshot.
    this.jsonrpc_server.addMethod('parity_sendTransaction', (data) => {return data}); //: Sends a transaction.
    this.jsonrpc_server.addMethod('parity_signMessage', (data) => {return data}); //: Signs a message with a specific account.
    this.jsonrpc_server.addMethod('parity_exportAccount', (data) => {return data}); //: Exports an account as a JSON file.    


    // Define the API routes
    this.router.get('/blocks', this.getBlocks);
    this.router.get('/blockchain', this.getBlockchain);
    this.router.get('/transactions', this.getTransactions);
    this.router.post('/transaction', this.createTransaction);
    this.router.get('/balance', this.getBalance);
    this.router.get('/wallets', this.getWallets);
    this.router.post('/wallet', this.createWallet);
    this.router.post('/wallet/import', this.importWallet);
    this.router.post('/wallet/deposit', this.deposit);
    this.router.post('/deploy/contract', this.deployContract);
    this.router.post('/execute/contract', this.executeContract);

    this.router.post('/merchant/transaction', this.merchantTransaction);

    this.router.get('/connect-to-blockchain', this.connectToBlockchain);

    this.ethereum.post('/', this.rpc);

    this.router.get('/quotes', async (req, res) => {
      let parValue = 5.00;
      const maxCommodityShares = 250000000;
      let marketCap = maxCommodityShares * parValue;

      const { getGoldExchangeRate, getSilverExchangeRate, getQuartzExchangeRate } = require('./exchange');

      const goldRates = await getGoldExchangeRate();
      const silverRates = await getSilverExchangeRate();
      const quartzRate = await getQuartzExchangeRate();

      this.goldPrice = Number(goldRates.exchangeRate); // The current price of gold
      this.silverPrice = Number(silverRates.exchangeRate); // The current price of silver
      this.quartzPrice = Number(quartzRate.exchangeRate); // The current price of quartz

      let totalGoldTokensIssued = (maxCommodityShares * this.goldPrice);
      let totalSilverTokensIssued = (maxCommodityShares * this.silverPrice); 
      let totalQuartzTokensIssued = (maxCommodityShares * this.quartzPrice);

      if (totalGoldSupply > 0) {
        totalGoldSupply += Number(totalGoldTokensIssued);
      } else {
        totalGoldSupply = Number(totalGoldTokensIssued);
      }

      if (totalGoldSupply > 0) {
        if (totalGoldTokensIssued > totalGoldSupply) {
          if (exchangeGoldHoldings > 0) {
              // calculate the defficiency and move from the exchange holding queue
              exchangeGoldHoldings -= Number(totalGoldTokensIssued - totalGoldSupply);
          }
        } else if (totalGoldTokensIssued < totalGoldSupply) {
          // calculate the excess silver and place in exchange holding queue
          exchangeGoldHoldings += Number(totalGoldSupply - totalGoldTokensIssued);
        }
      }
      totalGoldSupply = Number(totalGoldTokensIssued);


      let goldTokenPrice =  Math.max(this.goldPrice, parValue, marketCap / totalGoldTokensIssued);
      let silverTokenPrice = Math.max(this.silverPrice, parValue, marketCap / totalSilverTokensIssued);
      let quartzTokenPrice = Math.max(this.quartzPrice, parValue, marketCap / totalQuartzTokensIssued);

      let totalTokensIssued = totalGoldTokensIssued + totalSilverTokensIssued + totalQuartzTokensIssued;
      
      while (goldTokenPrice < parValue && totalGoldTokensIssued <= totalTokensIssued) {
        // Increase the total tokens issued by a certain factor (e.g., 10%)
        totalGoldTokensIssued *= 1.1;
      
        // Recalculate the token price
        goldTokenPrice =  Math.max(this.goldPrice, parValue, marketCap / totalGoldTokensIssued);
      }

      totalTokensIssued = totalGoldTokensIssued + totalSilverTokensIssued;

      while (silverTokenPrice < parValue && totalSilverTokensIssued <= totalTokensIssued) {
        // Increase the total tokens issued by a certain factor (e.g., 10%)
        totalSilverTokensIssued *= 1.1;
      
        // Recalculate the token price
        silverTokenPrice = Math.max(this.silverPrice, parValue, marketCap / totalSilverTokensIssued);
      }

      if (totalSilverSupply > 0) {
        if (totalSilverTokensIssued > totalSilverSupply) {
          if (exchangeSilverHoldings > 0) {
              // calculate the defficiency and move from the exchange holding queue
              exchangeSilverHoldings -= Number(totalSilverTokensIssued - totalSilverSupply);
          }
        } else if (totalSilverTokensIssued < totalSilverSupply) {
          // calculate the excess silver and place in exchange holding queue
          exchangeSilverHoldings += Number(totalSilverSupply - totalSilverTokensIssued);
        }
      }
      totalSilverSupply = Number(totalSilverTokensIssued);

      if (totalQuartzSupply > 0) {
        if (totalQuartzTokensIssued > totalQuartzSupply) {
          if (exchangeQuartzHoldings > 0) {
            exchangeQuartzHoldings -= Number(totalQuartzTokensIssued - totalQuartzSupply);
          }
        } else if (totalQuartzTokensIssued < totalQuartzSupply) {
          exchangeQuartzHoldings += Number(totalQuartzSupply - totalQuartzTokensIssued);
        }
      }

      if (totalTokenSupply > 0) {
        totalTokenSupply += Number(totalTokensIssued);
      } else {
        totalTokenSupply = Number(totalTokensIssued);
      }

      //const Gold = require('./gold');
      //Gold.updateTotalSupply(totalGoldTokensIssued);

      //const Silver = require('./silver');
      //Silver.updateTotalSupply(totalSilverTokensIssued);

      
      res.json({
        token: {
          gold: {
            price: goldTokenPrice.toFixed(2),
            issued: totalGoldTokensIssued.toFixed(0),
            exchange: {
              total: exchangeGoldHoldings.toFixed(0)
            }
          },
          silver: {
            price: silverTokenPrice.toFixed(2),
            issued: totalSilverTokensIssued.toFixed(0),
            exchange: {
              total: exchangeSilverHoldings.toFixed(0)
            }
          },
          quartz: {
            price: quartzTokenPrice.toFixed(2),
            issued: totalQuartzTokensIssued.toFixed(0),
            exchange: {
              total: exchangeQuartzHoldings.toFixed(0)
            }
          },
          total: totalTokensIssued,
          exchange: {
            total: exchangeTokenHoldings.toFixed(0)
          }
        },
        gold: this.goldPrice.toFixed(2),
        silver: this.silverPrice.toFixed(2),
        quartz: this.quartzPrice.toFixed(2),
        parValue: parValue
      })
    })
  }

  getBlocks = (req, res) => {
    res.json(this.blockchain.chain);
  }

  getBlockchain = (req, res) => {
    res.json(this.blockchain);
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

  getWallets = (req, res) => {
    const wallets = this.wallet.getWallets();
    console.log(wallets);
    res.json({wallets});
  }

  importWallet = (req, res) => {
    var address = this.wallet.importWallet(req.body.name,req.body.email,req.body.metal,req.body.privateKey);
    res.json({ address });
  }

  deposit = (req, res) => {
    this.wallet.deposit(req.body.wallet,req.body.amount,req.body.fee,this.goldPrice,this.silverPrice);
    res.json("success");
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

  merchantTransaction = (req, res) => {
    const {merchant, sender, recipient, amount} = req.body;
    const MerchantAPI = require('./merchant');
    const merchantAPI = new MerchantAPI(this.blockchain, merchant);
    try {
      merchant.verifyMerchant();
      var result = merchant.createTransaction(sender,recipient,amount);
      res.json(result);
    } catch(error) {
      res.status(400).json({ error: error.message });
    }
  }

  connectToBlockchain = (req, res) => {
    const { host, port } = req.query;

    // Logic to connect to the specified blockchain peer
    // Example: You can use the host and port values to establish a connection
    // with another blockchain server
  
    res.json({ blockchain: this.blockchain });
  }
  rpc = (req, res) => {
    const jsonRPCRequest = req.body;
    // server.receive takes a JSON-RPC request and returns a promise of a JSON-RPC response.
    // It can also receive an array of requests, in which case it may return an array of responses.
    // Alternatively, you can use server.receiveJSON, which takes JSON string as is (in this case req.body).
    this.jsonrpc_server.receive(jsonRPCRequest).then((jsonRPCResponse) => {
      if (jsonRPCResponse) {
        res.json(jsonRPCResponse);
      } else {
        // If response is absent, it was a JSON-RPC notification method.
        // Respond with no content status (204).
        res.sendStatus(204);
      }
    });
  }
  loadScript(base64Code) {
    const classString = atob(base64Code);
    const DynamicClass = eval(`(${classString})`);
    return new DynamicClass();
  }
  asciiToHex(text) {
    const buffer = Buffer.from(text, "utf8");
    return buffer.toString("hex");    
  }
  hexToAscii(hex) {
    const buffer = Buffer.from(hex, "hex");
    return buffer.toString("utf8");
  }

  start(port) {
    const app = express();
    app.use(express.json());
    app.use('/api', this.router);

    app.listen(port, () => {
      console.log(`Currency API server started on port ${port}`);
    });

    const ethereum = express();
    ethereum.use(express.json());
    ethereum.use('/', this.ethereum);

    ethereum.listen(8545,() => {
      console.log("JSON-RPC server started at http://localhost:8545");
    })
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
const MerchantAPI = require('./merchant');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 800,
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
