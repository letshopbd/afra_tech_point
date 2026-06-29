const { createClient } = require('@libsql/client');
require('dotenv').config();

async function main() {
  const url = process.env.TURSO_DB_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  console.log("Connecting to:", url);
  console.log("Token starts with:", authToken ? authToken.substring(0, 15) : "undefined");

  try {
    const client = createClient({ url, authToken });
    const result = await client.execute("SELECT 1+1 AS result;");
    console.log("SUCCESS! Connection established. Query result:", result.rows);
  } catch (err) {
    console.error("FAILED to connect to Turso:", err);
  }
}

main();
