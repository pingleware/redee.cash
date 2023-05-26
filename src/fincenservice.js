"use strict"

// Mock SAR submission to FINCEN
class FINCENService {
    // See https://www.fincen.gov/resources/filing-information
    static submitSAR(walletId, transactionId) {
      console.log(`Submitted SAR for Wallet '${walletId}' and Transaction '${transactionId}' to FINCEN.`);
    }
}

module.exports = FINCENService;