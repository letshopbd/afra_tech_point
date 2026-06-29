const { createClient } = require('@libsql/client')
const bcrypt = require('bcryptjs')
require('dotenv').config()

const turso = createClient({
  url: process.env.TURSO_DB_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

async function main() {
  const username = 'afratech'
  const password = 'afra5102'
  const hashedPassword = await bcrypt.hash(password, 10)

  // Delete old admin user
  await turso.execute('DELETE FROM users')

  // Insert new user
  await turso.execute({
    sql: 'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
    args: [username, hashedPassword, 'admin@afratech.com']
  })

  console.log('✅ User updated successfully!')
  console.log('   Username:', username)
  console.log('   Password:', password)
}

main().catch(console.error)
