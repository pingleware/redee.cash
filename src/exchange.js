"use strict"

const axios = require('axios');

const apiKey = 'API_KEY';


async function getGoldExchangeRate() {
    try {
      //const response = await axios.get(`https://api.metals.live/v1/spot/gold`);
      //const quotes = response.data;
      return {
        latestDate: new Date().getTime(),
        exchangeRate: 0.007126 
      }  
    } catch(error) {
      console.error('Error retrieving exchange rate:', error);
    }
}

async function getSilverExchangeRate() {
  try {
    //const response = await axios.get(`https://api.metals.live/v1/spot/silver`);
    //const quotes = response.data;
    return {
      latestDate: new Date().getTime(),
      exchangeRate: 0.070654  
    } 
  } catch(error) {
    console.error('Error retrieving exchange rate:', error);
  }
}

async function getQuartzExchangeRate() {
  try {
    /*
    // URL of the Yahoo Finance page for quartz
    const url = 'https://finance.yahoo.com/quote/QUARTZ-USD/';

    // Make a GET request to the URL
    const response = await axios.get(url);

    // Load the HTML content of the page with Cheerio
    const $ = cheerio.load(response.data);

    // Extract the price from the HTML (modify this based on the actual structure of the page)
    const price = $('span[data-reactid="32"]').text();

    // Extract the timestamp from the HTML (modify this based on the actual structure of the page)
    const timestamp = $('span[data-reactid="37"]').text();
    */

    return {
      latestDate: new Date().getTime(),
      exchangeRate: 0.2521  
    } 
  } catch(error) {
    console.error('Error retrieving exchange rate:', error);
  }
}

function computeTokenQuantity(usdAmount, conversionRate) {
    var digitalTokenAmount = Number(usdAmount) / Number(conversionRate);
    return digitalTokenAmount;
}

function computeUSD(digitalTokenAmount, conversionRate) {
    var usdAmount = Number(digitalTokenAmount * conversionRate);
    return usdAmount;
}


module.exports = {
  getGoldExchangeRate,
  getSilverExchangeRate,
  getQuartzExchangeRate,
  computeTokenQuantity,
  computeUSD
}