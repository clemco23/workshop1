require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

// Prisma 6 works directly with PostgreSQL without needing an adapter
const prisma = new PrismaClient();

module.exports = { prisma };
