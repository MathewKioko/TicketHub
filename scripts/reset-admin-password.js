/**
 * Script to reset admin user password
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function resetAdminPassword() {
  try {
    const email = 'kiokomathew1985@gmail.com'
    const newPassword = 'Mathew@2026'

    // Hash password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update user with password and make sure they're admin and verified
    const user = await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        role: 'ADMIN',
        verified: true,
      },
    })

    console.log(`✅ Password reset for ${email}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Verified: ${user.verified}`)
    console.log(`   Now try logging in with password: ${newPassword}`)
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

resetAdminPassword()
