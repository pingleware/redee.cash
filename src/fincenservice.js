"use strict"

const os = require('os');
const fs = require('fs');
const path = require('path');
const { create } = require('xmlbuilder2');
const schemaUrl = 'https://www.fincen.gov/base/EFL_SARXBatchSchema.xsd'; // URL of the XSD schema
const { MongoClient } = require('mongodb');


// Mock SAR submission to FINCEN
class FINCENService {
    // See https://www.fincen.gov/resources/filing-information
    //
    // https://bsaefiling.fincen.treas.gov/docs/XMLUserGuide_FinCENSAR.pdf
    //
    static submitSAR(reason="Money laundering", walletId, transaction) {
      const wallet = wallets[walletId];

      console.log(`Submitted SAR for Wallet '${walletId}' and Transaction '${transaction.id}' to FINCEN.`);

      const subjectInformation = getSubjectInformationByWalletID(walletId);

      // JSON object representing the data
      const data = {
        SARXBatch: {
          Header: {
            BatchNumber: '',
            ReportingEntity: 'PRESSPAGE ENTERTAINMENT INC dba REDEECASH',
            ReportingEntityContact: 'PATRICK INGLE',
            ReportingEntityPhoneNumber: '212-879-0758'
          },
          SAR: [
            {
              SARNumber: '',
              SubjectInformation: {
                Name: wallet.name,
                Address: `${subjectInformation.address} ${subjectInformation.city},${subjectInformation.state} ${subjectInformation.zipcode} ${subjectInformation.country}`,
                DateOfBirth: subjectInformation.dob,
                SSN: subjectInformation.ssn
              },
              SuspiciousActivity: reason,
              Attachment: btoa(JSON.stringify(transaction))
            },
            // Add additional SAR objects as needed
          ]
        }
      };

      // See https://bsaefiling.fincen.treas.gov/docs/XMLUserGuide_FinCENFBAR.pdf
      const xmlSARS = createXMLDocument(schemaUrl,data);
      const now = new Date();
      const fileName = `FBARXST.${now.getFullYear()}${now.getMonth()}${now.getDate()}${now.getHours()}${now.getMinutes()}${now.getSeconds()}.PRESSPAGEENTERTAINMENTINCdbaREDEECASH.xml`;
      fs.writeFileSync(path.join(os.homedir(),fileName),xmlSARS);
      return fileName;
    }

    // Function to create the XML document
    static createXMLDocument(schemaUrl, data) {
      const xmlBuilder = create({ version: '1.0', encoding: 'UTF-8' });

      // Load the XSD schema
      xmlBuilder.dtd({ sysID: schemaUrl });

      // Build the XML document based on the JSON data
      const xmlDocument = xmlBuilder
        .ele(data)
        .end({ prettyPrint: true });

      return xmlDocument;
    }

    static async getSubjectInformationByWalletID(walletID) {
      const uri = 'mongodb://localhost:27017'; // MongoDB connection URI
      const dbName = 'redee.cash'; // Your MongoDB database name
      const collectionName = 'Users'; // Your MongoDB collection name
    
      const client = new MongoClient(uri);
    
      try {
        await client.connect();
    
        const database = client.db(dbName);
        const collection = database.collection(collectionName);
    
        const subjectInfo = await collection.findOne({ walletID });
        
        return subjectInfo.SubjectInformation;
      } finally {
        await client.close();
      }
    }
    
}

module.exports = FINCENService;