const mongoose = require('mongoose');
const axios = require('axios');
const csv = require('csv-parser');
require('dotenv').config();
const Company = require('./models/Company');

const YC_CSV_URL = 'https://github.com/24msingh24/2024-YCombinator-All-Companies-Datasets/raw/refs/heads/main/companies.csv';

const seedGlobalCompanies = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('📡 Fetching global tech company dataset...');
    const response = await axios({
      method: 'get',
      url: YC_CSV_URL,
      responseType: 'stream'
    });

    let count = 0;
    const batchSize = 100;
    let batch = [];

    response.data
      .pipe(csv())
      .on('data', (row) => {
        if (row.name && row.website) {
          batch.push({
            name: row.name,
            website: row.website,
            description: row.oneLiner || row.longDescription,
            status: 'Pending_Discovery'
          });

          if (batch.length >= batchSize) {
            const currentBatch = [...batch];
            batch = [];
            // We'll use bulkWrite for performance
            Company.bulkWrite(
              currentBatch.map(c => ({
                updateOne: {
                  filter: { name: c.name },
                  update: { $set: c },
                  upsert: true
                }
              }))
            ).catch(err => console.error('Bulk write error:', err.message));
            
            count += currentBatch.length;
            if (count % 500 === 0) console.log(`Processed ${count} companies...`);
          }
        }
      })
      .on('end', async () => {
        if (batch.length > 0) {
          await Company.bulkWrite(
            batch.map(c => ({
              updateOne: {
                filter: { name: c.name },
                update: { $set: c },
                upsert: true
              }
            }))
          );
          count += batch.length;
        }
        console.log(`\n🎉 SEEDING COMPLETE! Total companies in database: ${count}`);
        console.log('Next Step: Initiating Career Page Discovery Service.');
        setTimeout(() => process.exit(0), 2000);
      })
      .on('error', (err) => {
        console.error('❌ Error processing CSV:', err.message);
        process.exit(1);
      });

  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
};

seedGlobalCompanies();
