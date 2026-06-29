const { createClient } = require('@libsql/client')
const bcrypt = require('bcryptjs')
require('dotenv').config()

const turso = createClient({
  url: process.env.TURSO_DB_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

async function main() {
  console.log('Connecting to Turso...')
  console.log('DB URL:', process.env.TURSO_DB_URL)

  if (!process.env.TURSO_DB_URL || !process.env.TURSO_AUTH_TOKEN) {
    throw new Error('TURSO_DB_URL and TURSO_AUTH_TOKEN must be set in .env')
  }

  // 1. Drop existing tables
  console.log('Dropping existing tables...')
  const tables = ['_prisma_migrations', 'sale_items', 'sales', 'invoices', 'stock_ledger', 'purchase_items', 'purchases', 'items', 'settings', 'users']
  for (const t of tables) {
    try {
      await turso.execute(`DROP TABLE IF EXISTS "${t}"`)
      console.log(`Dropped table "${t}"`)
    } catch (err) {
      console.log(`Failed to drop "${t}":`, err.message)
    }
  }

  // 2. Create tables
  console.log('Creating tables...')
  const schema = [
    // Users
    `CREATE TABLE "users" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "username" TEXT NOT NULL UNIQUE,
      "password" TEXT NOT NULL,
      "email" TEXT,
      "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    // Items
    `CREATE TABLE "items" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL UNIQUE,
      "description" TEXT,
      "cost" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      "price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      "itemType" TEXT NOT NULL DEFAULT 'product',
      "barcode" TEXT UNIQUE,
      "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    // Purchases
    `CREATE TABLE "purchases" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "supplier_id" INTEGER,
      "remarks" TEXT,
      "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    // PurchaseItems
    `CREATE TABLE "purchase_items" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "purchase_id" INTEGER NOT NULL,
      "item_id" INTEGER NOT NULL,
      "quantity" INTEGER NOT NULL,
      "unit" TEXT NOT NULL DEFAULT 'pcs',
      "rate" DECIMAL(10,2) NOT NULL,
      "total" DECIMAL(10,2) NOT NULL,
      "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    // Sales
    `CREATE TABLE "sales" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "customer" TEXT NOT NULL,
      "customer_phone" TEXT,
      "customer_address" TEXT,
      "remarks" TEXT,
      "is_service_job" INTEGER NOT NULL DEFAULT 0,
      "device_model" TEXT,
      "problem_desc" TEXT,
      "service_status" TEXT NOT NULL DEFAULT 'pending',
      "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    // SaleItems
    `CREATE TABLE "sale_items" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "sale_id" INTEGER NOT NULL,
      "item_id" INTEGER NOT NULL,
      "quantity" INTEGER NOT NULL,
      "unit" TEXT NOT NULL DEFAULT 'pcs',
      "rate" DECIMAL(10,2) NOT NULL,
      "total" DECIMAL(10,2) NOT NULL,
      "imei_number" TEXT,
      "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    // StockLedger
    `CREATE TABLE "stock_ledger" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "item_id" INTEGER NOT NULL,
      "quantity" INTEGER NOT NULL,
      "unit" TEXT NOT NULL DEFAULT 'pcs',
      "rate" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      "type" INTEGER NOT NULL,
      "ref_type" TEXT NOT NULL,
      "ref_id" INTEGER NOT NULL,
      "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    // Invoices
    `CREATE TABLE "invoices" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "invoice_number" TEXT NOT NULL UNIQUE,
      "sale_id" INTEGER NOT NULL UNIQUE,
      "customer_name" TEXT,
      "customer_phone" TEXT,
      "customer_address" TEXT,
      "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      "tax_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      "total_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      "payment_status" TEXT NOT NULL DEFAULT 'pending',
      "payment_method" TEXT,
      "notes" TEXT,
      "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    // Settings
    `CREATE TABLE "settings" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "admin_name" TEXT,
      "admin_phone" TEXT,
      "admin_email" TEXT,
      "company_name" TEXT,
      "company_address" TEXT,
      "currency" TEXT NOT NULL DEFAULT '৳',
      "invoice_company_name" TEXT NOT NULL DEFAULT 'OnPoint Gadget',
      "invoice_company_address" TEXT NOT NULL DEFAULT 'Mohila Collage Gate, Dhunat, Bogura',
      "invoice_phone" TEXT NOT NULL DEFAULT '017044996944',
      "invoice_logo" TEXT,
      "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`
  ]

  for (const q of schema) {
    await turso.execute(q)
  }
  console.log('Tables created successfully!')

  // 3. Create Indexes
  console.log('Creating indexes...')
  const indexes = [
    `CREATE INDEX "purchase_items_purchase_id_idx" ON "purchase_items"("purchase_id");`,
    `CREATE INDEX "purchase_items_item_id_idx" ON "purchase_items"("item_id");`,
    `CREATE INDEX "sales_created_at_idx" ON "sales"("created_at");`,
    `CREATE INDEX "sale_items_sale_id_idx" ON "sale_items"("sale_id");`,
    `CREATE INDEX "sale_items_item_id_idx" ON "sale_items"("item_id");`,
    `CREATE INDEX "stock_ledger_item_id_idx" ON "stock_ledger"("item_id");`,
    `CREATE INDEX "stock_ledger_created_at_idx" ON "stock_ledger"("created_at");`,
    `CREATE INDEX "invoices_created_at_idx" ON "invoices"("created_at");`
  ]

  for (const idx of indexes) {
    await turso.execute(idx)
  }
  console.log('Indexes created successfully!')

  // 4. Create Default Admin User
  console.log('Creating default admin user...')
  const hashedPassword = await bcrypt.hash('admin', 10)
  await turso.execute({
    sql: 'INSERT INTO "users" (username, password, email) VALUES (?, ?, ?)',
    args: ['admin', hashedPassword, 'admin@example.com']
  })
  console.log('Default admin user created! (Username: admin, Password: admin)')

  // 5. Create Default Settings Record
  console.log('Creating default settings record...')
  await turso.execute({
    sql: 'INSERT INTO "settings" (admin_name, currency, invoice_company_name, invoice_company_address, invoice_phone) VALUES (?, ?, ?, ?, ?)',
    args: ['Admin', '৳', 'OnPoint Gadget', 'Mohila Collage Gate, Dhunat, Bogura', '017044996944']
  })
  console.log('Default settings record created!')

  console.log('ALL DONE! Turso database has been fully reset and seed data has been injected successfully!')
}

main().catch(console.error)
