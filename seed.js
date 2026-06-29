/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('afra5102', 10)
  
  const user = await prisma.user.upsert({
    where: { username: 'afratech' },
    update: {
      password: hashedPassword
    },
    create: {
      username: 'afratech',
      password: hashedPassword,
      email: 'admin@afratech.com',
    },
  })

  console.log('User created:', user)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
