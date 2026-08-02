/**
 * Script to create a verified admin user
 * Usage: node scripts/create-admin.js
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    const email = 'kiokomathew1985@gmail.com'
    const password = 'Mathew@2026'
    const name = 'Mathew Kioko'

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      // Update existing user to admin and verified
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: { 
          role: 'ADMIN',
          verified: true,
          name: name,
        },
      })
      console.log(`✅ Updated existing user to ADMIN`)
      console.log(`   User ID: ${updatedUser.id}`)
      console.log(`   Role: ${updatedUser.role}`)
      console.log(`   Verified: ${updatedUser.verified}`)
      return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create new admin user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN',
        verified: true, // Auto-verify for admin
      },
    })

    console.log(`✅ Created ADMIN user`)
    console.log(`   User ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Verified: ${user.verified}`)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()
