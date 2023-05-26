"use strict"

const fetch = require('node-fetch');

const apiKey = 'YOUR_ALPHA_VANTAGE_API_KEY';
const currency = 'USD';
const symbol = 'XAU'; // XAU represents gold

async function getExchangeRate() {
    try {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${currency}&to_symbol=${symbol}&apikey=${apiKey}`
      );
      const data = await response.json();
  
      // Extract the latest exchange rate from the data
      const latestDate = Object.keys(data['Time Series FX (Daily)'])[0];
      const exchangeRate = data['Time Series FX (Daily)'][latestDate]['4. close'];
  
      console.log(`Exchange rate of ${currency}/${symbol}: ${exchangeRate}`);
      return {
        latestDate: latestDate,
        exchangeRate: exchangeRate
      }
    } catch (error) {
      console.error('Error retrieving exchange rate:', error);
    }
}

function computeTokenQuantity(usdAmount) {
    var conversionRate = getExchangeRate().exchangeRate;
    var digitalTokenAmount = usdAmount * conversionRate;
    return digitalTokenAmount;
}

function computeUSD(digitalTokenAmount) {
    var conversionRate = getExchangeRate().exchangeRate;
    var usdAmount = digitalTokenAmount / conversionRate;
    return usdAmount;
}


module.exports = {
    getExchangeRate,
    computeTokenQuantity,
    computeUSD
}