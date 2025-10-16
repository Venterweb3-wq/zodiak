require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;
const COLLECTIONS_TO_DROP = [
    'coinglass_market_funding_rates',
    'coinglass_market_liquidations',
    'coinglass_market_long_short_ratios',
    'coinglass_market_open_interest'
];

async function cleanup() {
    if (!MONGO_URI) {
        console.error('MONGO_URI is not set in the .env file. Aborting.');
        process.exit(1);
    }

    try {
        console.log('Connecting to MongoDB to clean up old collections...');
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected successfully.');

        const db = mongoose.connection.db;
        const existingCollections = (await db.listCollections().toArray()).map(c => c.name);

        console.log('\\nStarting cleanup...');
        for (const collectionName of COLLECTIONS_TO_DROP) {
            if (existingCollections.includes(collectionName)) {
                try {
                    await db.dropCollection(collectionName);
                    console.log(`✅ Successfully dropped collection: ${collectionName}`);
                } catch (err) {
                    console.error(`❌ Error dropping collection ${collectionName}:`, err.message);
                }
            } else {
                console.log(`ℹ️ Collection not found, skipping: ${collectionName}`);
            }
        }
        console.log('\\nCleanup finished.');

    } catch (error) {
        console.error('An unexpected error occurred:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB connection closed.');
        process.exit(0);
    }
}

cleanup(); 