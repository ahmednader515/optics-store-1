import { PrismaClient } from '@prisma/client'

/** Increment when changing Prisma setup so Next.js dev HMR does not reuse an old singleton (e.g. Accelerate vs direct DB). */
const PRISMA_SINGLETON_VERSION = 2

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
  // eslint-disable-next-line no-var
  var prismaSingletonVersion: number | undefined
}

function createPrismaClient(): PrismaClient {
  if (
    globalThis.prisma &&
    globalThis.prismaSingletonVersion !== PRISMA_SINGLETON_VERSION
  ) {
    void globalThis.prisma.$disconnect()
    globalThis.prisma = undefined
  }

  const client =
    globalThis.prisma &&
    globalThis.prismaSingletonVersion === PRISMA_SINGLETON_VERSION
      ? globalThis.prisma
      : new PrismaClient()

  if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = client
    globalThis.prismaSingletonVersion = PRISMA_SINGLETON_VERSION
  }

  return client
}

export const prisma = createPrismaClient()
