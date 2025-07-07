const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://tripgenius:tripgenius123@localhost:5432/tripgenius_db',
});

async function createUserPreferencesTable() {
  const client = await pool.connect();
  
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id SERIAL PRIMARY KEY,
        user_email VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE,
        preferred_currency VARCHAR(3) DEFAULT 'USD',
        budget_range VARCHAR(50),
        travel_style VARCHAR(50),
        interests JSONB,
        dietary_restrictions TEXT,
        accessibility_needs TEXT,
        notification_settings JSONB DEFAULT '{"email": true, "push": false}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_email)
      )
    `);
    
    console.log('✅ User preferences table created successfully');
  } catch (error) {
    console.error('❌ Error creating user preferences table:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createUserPreferencesTable();