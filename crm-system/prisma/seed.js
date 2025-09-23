const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)

  const admin = await prisma.adminUser.upsert({
    where: { email: 'abiola@mieladigital.com' },
    update: {},
    create: {
      email: 'abiola@mieladigital.com',
      passwordHash: adminPassword,
      role: 'SUPER_ADMIN',
      firstName: 'Abiola',
      lastName: 'Admin',
      isActive: true,
    },
  })

  console.log('✅ Created admin user:', admin.email)

  console.log('🎉 Database seeded successfully with admin user only!')
  console.log('📋 No sample data was created - database is clean and ready for real data.')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })