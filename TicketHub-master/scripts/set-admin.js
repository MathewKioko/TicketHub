/**
 * Script to set a user as admin
 * Usage: node scripts/set-admin.js <email>
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function setUserAsAdmin(email) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      console.log(`❌ User with email ${email} not found`)
      return
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' },
    })

    console.log(`✅ User ${email} is now an ADMIN`)
    console.log(`   User ID: ${updatedUser.id}`)
    console.log(`   Role: ${updatedUser.role}`)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Get email from command line argument
const email = process.argv[2]

if (!email) {
  console.log('Usage: node scripts/set-admin.js <email>')
  console.log('Example: node scripts/set-admin.js admin@example.com')
  process.exit(1)
}

setUserAsAdmin(email)
