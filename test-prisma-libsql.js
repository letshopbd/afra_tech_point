const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
const { createClient } = require('@libsql/client');
require('dotenv').config();

const url = process.env.TURSO_DB_URL;
const token = process.env.TURSO_AUTH_TOKEN;

console.log('Testing Prisma LibSQL connection...');
console.log('URL:', url);

try {
  const adapter = new PrismaLibSql({
    url: url,
    authToken: token,
  });
  const prisma = new PrismaClient({ adapter });

  console.log('Client and adapter created, running database cleanup...');
  
  async function cleanup() {
    const deletedInvoices = await prisma.$executeRawUnsafe(
      `DELETE FROM invoices WHERE sale_id NOT IN (SELECT id FROM sales);`
    );
    console.log(`Deleted ${deletedInvoices} orphaned invoices`);
  }

  cleanup()
    .then(() => {
      console.log('Database cleanup completed successfully!');
      process.exit(0);
    })
    .catch(err => {
      console.error('Cleanup error:', err);
      process.exit(1);
    });
} catch (err) {
  console.error('Error initializing prisma/libsql:', err);
}
