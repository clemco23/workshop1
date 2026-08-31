const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const dotenv = require('dotenv');

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const result = await prisma.$queryRaw`SELECT 1 AS ok`;
  console.log('DB_OK', JSON.stringify(result));
}

main()
  .catch((error) => {
    console.error('DB_ERROR', error.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
