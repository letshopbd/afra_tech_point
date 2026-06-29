const { createClient } = require('@libsql/client');
require('dotenv').config();

const url = process.env.TURSO_DB_URL;
const token = process.env.TURSO_AUTH_TOKEN;

console.log('Testing LibSQL client...');
console.log('URL:', url);
console.log('Token length:', token ? token.length : 0);

try {
  const client = createClient({
    url: url,
    authToken: token
  });
  console.log('Client created successfully!');
} catch (err) {
  console.error('Error creating client:', err);
}
