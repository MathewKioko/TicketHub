const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixUserRoles() {
  try {
    // Use raw MongoDB query to update invalid roles
    const result = await prisma.$runCommandRaw({
      update: 'users',
      updates: [
        {
          q: { role: 'admin' },
          u: { $set: { role: 'ORGANIZER' } },
          multi: true
        }
      ]
    })

    console.log('Fixed user roles:', result)
    console.log('All users with role "admin" have been updated to "ORGANIZER"')
  } catch (error) {
    console.error('Error fixing roles:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixUserRoles()

