"use strict"

const accountId = "ACCOUNT NUMBER WITH GOLD BROKEE?";

class Gold {
    static async purchase(usdAmount) {
        try {
            // Make API request to purchase gold
            const response = await fetch('API_PURCHASE_GOLD_URL', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: 'API_KEY' // Replace with your actual API key
              },
              body: JSON.stringify({
                accountId,
                usdAmount
              })
            });
      
            const purchaseData = await response.json();
      
            if (purchaseData.success) {
                let purchasedGrams = purchaseData.amount;
                return purchasedGrams;
            } else {
              console.log('Gold purchase failed:', purchaseData.error);
              return -1;
            }
        } catch (error) {
            console.error('Error purchasing gold:', error);
            return -1;
        }      
    }

    static async sell(goldAmount) {
        try {
            // Make API request to sell gold
            const response = await fetch('API_SELL_GOLD_URL', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'API_KEY' // Replace with your actual API key
                },
                body: JSON.stringify({
                    accountId,
                    goldAmount
                })
            });

            const sellData = await response.json();  
            if (sellData.success) {
                return true;
            } else {
                return false;
            }          
        } catch(error) {
            return false;
        }
    }
}

module.exports = Gold;