/**
 * Script to reset admin user password.
 *
 * SECURE USAGE (no hardcoded credentials):
 *   ADMIN_EMAIL=kiokomathew1985@gmail.com ADMIN_PASSWORD='Mateo@2028$' node scripts/reset-admin-password.js
 *
 * On Windows (PowerShell):
 *   $env:ADMIN_EMAIL="kiokomathew1985@gmail.com"; $env:ADMIN_PASSWORD="Mateo@2028$"; node scripts/reset-admin-password.js
 *
 * This script also clears any login lockout (loginAttempts / lockUntil) so a
 * previously locked-out admin can immediately sign in again.
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function resetAdminPassword() {
  try {
    const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase()
    const newPassword = process.env.ADMIN_PASSWORD || ''

    if (!email || !newPassword) {
      console.error('❌ Missing required environment variables.')
      console.error('   Set ADMIN_EMAIL and ADMIN_PASSWORD before running this script.')
      console.error('   Example: ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD="YourPass@123" node scripts/reset-admin-password.js')
      process.exit(1)
    }

    if (newPassword.length < 8) {
      console.error('❌ Password must be at least 8 characters long.')
      process.exit(1)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update user with password, make sure they're admin and verified,
    // and clear any login lockout so they can sign in immediately.
    const user = await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        role: 'ADMIN',
        verified: true,
        loginAttempts: 0,
        lockUntil: null,
      },
    })

    console.log(`✅ Password reset for ${email}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Verified: ${user.verified}`)
    console.log(`   Lockout cleared: yes`)
    console.log(`   Now try logging in with the new password.`)
  } catch (error) {
    console.error('Error:', error.message)
    if (error.code === 'P2025') {
      console.error('   User not found. Check the ADMIN_EMAIL value.')
    }
  } finally {
    await prisma.$disconnect()
  }
}

resetAdminPassword()
