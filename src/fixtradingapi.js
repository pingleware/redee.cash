"use strict"
/**
 * // Example usage
 * 
 * const fixTradingAPI = new FIXTradingAPI();
 * fixTradingAPI.connect('TARGET', 'SENDER', 'localhost', 9878);
 * 
 * // Send a sample FIX message
 * 
 * const sampleMessage = '8=FIX.4.2|9=012|35=D|49=SENDER|56=TARGET|34=001|52=20220527-10:30:00|98=0|108=30|10=053|';
 * fixTradingAPI.sendFIXMessage(sampleMessage);
 * 
 */

const fix = require('fix');
const Blockchain = require('./blockchain');
const faye = require('faye');

class FIXTradingAPI {
  constructor() {
    this.fixInitiator = null;
    this.blockchain = new Blockchain();
    this.fayeClient = new faye.Client('http://localhost:8000/faye');
  }

  /**
   * The connect method initializes the FIX initiator and establishes a session with the target and sender CompIDs, host, and port 
   * provided as parameters. The FIX settings are configured based on the provided connection details. 
   * The application object contains event handlers for session creation, logon, logout, and incoming messages. 
   * When a session is logged on, the onLogon handler sets the session object for further use.
   */
  connect(targetCompID, senderCompID, host, port) {
    const settings = {
      initiator: {
        senderCompID,
        targetCompID,
        protocol: 'tcp',
        host,
        port
      }
    };

    const application = {
      onCreate(session) {
        console.log('FIX session created');
      },
      onLogon(session) {
        console.log('FIX session logged on');
        this.fixInitiator = session;

        // Subscribe to blockchain updates
        this.subscribeToBlockchainUpdates();
      },
      onLogout(session) {
        console.log('FIX session logged out');
        this.fixInitiator = null;

        // Unsubscribe from blockchain updates
        this.unsubscribeFromBlockchainUpdates();
      },
      onMessage(message, session) {
        console.log('Received FIX message:', message);
        // Process and handle incoming FIX messages
      }
    };

    this.fixInitiator = new fix.Initiator(application, fix.generateSession, settings);
    this.fixInitiator.start();
  }

  /**
   * The sendFIXMessage method allows you to send FIX messages using the active session. If no session is available, an appropriate message is logged.
   */
  sendFIXMessage(message) {
    if (!this.fixInitiator) {
        console.log('No active FIX session');
        return;
      }
  
      this.fixInitiator.send(message);
      console.log('Sent FIX message:', message);
    }

    /**
     * The subscribeToBlockchainUpdates method subscribes to the /blockchain/updates channel on the Faye server, 
     * and the unsubscribeFromBlockchainUpdates method unsubscribes from the same channel.
     */
    subscribeToBlockchainUpdates() {
        this.fayeClient.subscribe('/blockchain/updates', this.handleBlockchainUpdate);
    }
    
    unsubscribeFromBlockchainUpdates() {
        this.fayeClient.unsubscribe('/blockchain/updates', this.handleBlockchainUpdate);
    }
    
      /**
       * The handleBlockchainUpdate method serves as the callback function to handle incoming blockchain updates
       */
    handleBlockchainUpdate = (block) => {
        // Process blockchain updates
        // You can perform any necessary actions based on new blocks or transactions
        console.log('Received blockchain update:', block);
    }
    
    // Additional methods for interacting with the blockchain and FIX API
}

module.exports = FIXTradingAPI;