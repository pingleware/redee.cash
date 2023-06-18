"use strict"

const axios = require('axios');

const apiKey = 'API_KEY';


async function getGoldExchangeRate() {
    try {
      const response = await axios.get(`https://api.metals.live/v1/spot/gold`);
      const quotes = response.data;
      return {
        latestDate: quotes[quotes.length - 1].timestamp,
        exchangeRate: Number(quotes[quotes.length - 1].price)  
      }  
    } catch(error) {
      console.error('Error retrieving exchange rate:', error);
    }
}

async function getSilverExchangeRate() {
  try {
    const response = await axios.get(`https://api.metals.live/v1/spot/silver`);
    const quotes = response.data;
    return {
      latestDate: quotes[quotes.length - 1].timestamp,
      exchangeRate: Number(quotes[quotes.length - 1].price)  
    } 
} catch(error) {
    console.error('Error retrieving exchange rate:', error);
  }
}

function computeTokenQuantity(usdAmount, conversionRate) {
    var digitalTokenAmount = usdAmount * conversionRate;
    return digitalTokenAmount;
}

function computeUSD(digitalTokenAmount, conversionRate) {
    var usdAmount = digitalTokenAmount / conversionRate;
    return usdAmount;
}


module.exports = {
  getGoldExchangeRate,
  getSilverExchangeRate,
  computeTokenQuantity,
  computeUSD
}