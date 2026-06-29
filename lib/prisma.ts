import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

function createPrismaClient() {
  const tursoUrl = process.env.TURSO_DB_URL || ''
  const tursoToken = process.env.TURSO_AUTH_TOKEN || ''

  if (tursoUrl.startsWith('libsql://') || tursoUrl.startsWith('https://')) {
    const adapter = new PrismaLibSQL({
      url: tursoUrl,
      authToken: tursoToken,
    })
    return new PrismaClient({ adapter })
  }

  // Local fallback (SQLite file)
  return new PrismaClient()
}

declare global {
  var prisma: undefined | ReturnType<typeof createPrismaClient>
}

export const prisma = globalThis.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
