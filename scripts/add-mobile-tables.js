const { createClient } = require('@libsql/client');
require('dotenv').config();

async function main() {
  const url = process.env.TURSO_DB_URL || process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    console.error('❌ TURSO_DB_URL is not set in .env');
    process.exit(1);
  }

  console.log('🔌 Connecting to Turso database...');

  const client = createClient({
    url,
    authToken
  });

  const statements = [
    `CREATE TABLE IF NOT EXISTS "mobile_phones" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "brand" TEXT NOT NULL,
      "model" TEXT NOT NULL,
      "color" TEXT,
      "ram" TEXT,
      "rom" TEXT,
      "imei1" TEXT NOT NULL UNIQUE,
      "imei2" TEXT UNIQUE,
      "purchase_price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      "sale_price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      "has_warranty" INTEGER NOT NULL DEFAULT 0,
      "warranty_days" INTEGER,
      "warranty_unit" TEXT DEFAULT 'day',
      "status" TEXT NOT NULL DEFAULT 'available',
      "notes" TEXT,
      "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS "mobile_sales" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "invoice_number" TEXT NOT NULL UNIQUE,
      "mobile_id" INTEGER NOT NULL UNIQUE,
      "customer" TEXT NOT NULL,
      "customer_phone" TEXT,
      "customer_address" TEXT,
      "sale_price" DECIMAL(10,2) NOT NULL,
      "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      "total_amount" DECIMAL(10,2) NOT NULL,
      "notes" TEXT,
      "sale_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE INDEX IF NOT EXISTS "mobile_phones_status_idx" ON "mobile_phones"("status")`,

    `CREATE INDEX IF NOT EXISTS "mobile_sales_created_at_idx" ON "mobile_sales"("created_at")`
  ];

  for (const sql of statements) {
    try {
      await client.execute(sql);
      const name = sql.match(/CREATE (?:TABLE|INDEX) IF NOT EXISTS "?(\w+)"?/i)?.[1] || 'statement';
      console.log(`✅ Created: ${name}`);
    } catch (err) {
      console.error(`❌ Error executing statement:`, err.message);
      console.error('SQL:', sql.substring(0, 100) + '...');
    }
  }

  // Ensure warranty_unit column exists in case table was created earlier
  try {
    await client.execute(`ALTER TABLE "mobile_phones" ADD COLUMN "warranty_unit" TEXT DEFAULT 'day'`);
    console.log(`✅ Added column: warranty_unit`);
  } catch (err) {
    if (!err.message.includes('duplicate column') && !err.message.includes('already exists')) {
      console.log(`ℹ️ Column warranty_unit: ${err.message}`);
    }
  }

  console.log('\n✅ Mobile tables setup complete!');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
