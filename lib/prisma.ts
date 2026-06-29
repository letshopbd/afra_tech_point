import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

function env(name: string): string | undefined {
  return process.env[name]
}

const prismaClientSingleton = () => {
  const tursoUrl = env('TURSO_DB_URL') || env('NEXT_PUBLIC_TURSO_DB_URL') || ''
  const tursoToken = env('TURSO_AUTH_TOKEN') || env('NEXT_PUBLIC_TURSO_AUTH_TOKEN') || ''

  if (tursoUrl.startsWith('libsql://')) {
    const adapter = new PrismaLibSQL({
      url: tursoUrl,
      authToken: tursoToken,
    })
    return new PrismaClient({ adapter })
  }

  return new PrismaClient()
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

export const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
