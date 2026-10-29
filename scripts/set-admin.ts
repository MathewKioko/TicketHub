/**
 * Script to set a user as admin
 * Usage: npx ts-node scripts/set-admin.ts <email>
 */

import { prisma } from '../lib/db'

async function setUserAsAdmin(email: string) {
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
    // @ts-ignore
    if (prisma.$disconnect) await prisma.$disconnect()
  }
}

// Get email from command line argument
const email = process.argv[2]

if (!email) {
  console.log('Usage: npx ts-node scripts/set-admin.ts <email>')
  console.log('Example: npx ts-node scripts/set-admin.ts admin@example.com')
  process.exit(1)
}

setUserAsAdmin(email)
