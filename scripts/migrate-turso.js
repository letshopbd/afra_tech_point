const { createClient } = require('@libsql/client')
const { PrismaClient } = require('@prisma/client')

const turso = createClient({
  url: process.env.TURSO_DB_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

async function main() {
  console.log('Dropping old tables...')
  const tables = ['sale_items','sales','invoices','stock_ledger','purchase_items','purchases','items','settings','users']
  for (const t of tables) {
    try { await turso.execute(`DROP TABLE IF EXISTS "${t}"`) } catch {}
  }

  console.log('Creating schema...')
  const stmts = `
    CREATE TABLE IF NOT EXISTS "users" (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password TEXT NOT NULL, email TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS "items" (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, description TEXT, cost DECIMAL(10,2) DEFAULT 0.00, price DECIMAL(10,2) DEFAULT 0.00, itemType TEXT DEFAULT 'product', barcode TEXT UNIQUE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS "purchases" (id INTEGER PRIMARY KEY AUTOINCREMENT, supplier_id INTEGER, remarks TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS "purchase_items" (id INTEGER PRIMARY KEY AUTOINCREMENT, purchase_id INTEGER NOT NULL, item_id INTEGER NOT NULL, quantity INTEGER NOT NULL, unit TEXT DEFAULT 'pcs', rate DECIMAL(10,2) NOT NULL, total DECIMAL(10,2) NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS "sales" (id INTEGER PRIMARY KEY AUTOINCREMENT, customer TEXT NOT NULL, customer_phone TEXT, customer_address TEXT, remarks TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, is_service_job INTEGER DEFAULT 0, device_model TEXT, problem_desc TEXT, service_status TEXT DEFAULT 'pending');
    CREATE TABLE IF NOT EXISTS "sale_items" (id INTEGER PRIMARY KEY AUTOINCREMENT, sale_id INTEGER NOT NULL, item_id INTEGER NOT NULL, quantity INTEGER NOT NULL, unit TEXT DEFAULT 'pcs', rate DECIMAL(10,2) NOT NULL, total DECIMAL(10,2) NOT NULL, imei_number TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS "stock_ledger" (id INTEGER PRIMARY KEY AUTOINCREMENT, item_id INTEGER NOT NULL, quantity INTEGER NOT NULL, unit TEXT DEFAULT 'pcs', rate DECIMAL(10,2) DEFAULT 0.00, type INTEGER NOT NULL, ref_type TEXT NOT NULL, ref_id INTEGER NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS "invoices" (id INTEGER PRIMARY KEY AUTOINCREMENT, invoice_number TEXT NOT NULL UNIQUE, sale_id INTEGER NOT NULL UNIQUE, customer_name TEXT, customer_phone TEXT, customer_address TEXT, subtotal DECIMAL(10,2) DEFAULT 0.00, tax_amount DECIMAL(10,2) DEFAULT 0.00, discount_amount DECIMAL(10,2) DEFAULT 0.00, total_amount DECIMAL(10,2) DEFAULT 0.00, payment_status TEXT DEFAULT 'pending', payment_method TEXT, notes TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS "settings" (id INTEGER PRIMARY KEY AUTOINCREMENT, admin_name TEXT, admin_phone TEXT, admin_email TEXT, company_name TEXT, company_address TEXT, currency TEXT DEFAULT '৳', invoice_company_name TEXT DEFAULT 'OnPoint Gadget', invoice_company_address TEXT DEFAULT 'Mohila Collage Gate, Dhunat, Bogura', invoice_phone TEXT DEFAULT '017044996944', invoice_logo TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
  `
  for (const s of stmts.split(';').map(s => s.trim()).filter(s => s.length > 0)) {
    await turso.execute(s + ';')
  }
  console.log('Schema created!')

  // Migrate data
  console.log('\nMigrating data...')
  const localPrisma = new PrismaClient()

  for (const table of tables) {
    try {
      const rows = await localPrisma.$queryRawUnsafe(`SELECT * FROM "${table}"`)
      if (!rows.length) { console.log(`${table}: 0 rows`); continue }

      const columns = Object.keys(rows[0]).filter(c => c !== 'id')
      const placeholders = columns.map(() => '?').join(', ')
      const colNames = columns.map(c => `"${c}"`).join(', ')
      const sql = `INSERT INTO "${table}" (${colNames}) VALUES (${placeholders})`

      let ok = 0
      for (const row of rows) {
        const values = columns.map(c => {
          const v = row[c]
          if (v instanceof Date) return v.toISOString()
          if (typeof v === 'bigint') return Number(v)
          return v
        })
        try {
          await turso.execute({ sql, args: values })
          ok++
        } catch (err) {
          if (!err.message.includes('UNIQUE')) console.error(`  ${table} error: ${err.message.substring(0,100)}`)
        }
      }
      console.log(`${table}: ${ok}/${rows.length}`)
    } catch (err) {
      console.log(`${table}: error - ${err.message.substring(0,80)}`)
    }
  }

  await localPrisma.$disconnect()
  console.log('\nDone!')
}

main().catch(console.error)
