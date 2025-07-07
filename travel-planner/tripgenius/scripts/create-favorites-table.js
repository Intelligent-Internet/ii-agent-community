const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://tripgenius:tripgenius123@localhost:5432/tripgenius_db',
});

async function createFavoritesTable() {
  const client = await pool.connect();
  
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_favorites (
        id SERIAL PRIMARY KEY,
        user_email VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE,
        itinerary_id VARCHAR(255) REFERENCES itineraries(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_email, itinerary_id)
      )
    `);
    
    console.log('✅ User favorites table created successfully');
  } catch (error) {
    console.error('❌ Error creating user favorites table:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createFavoritesTable();