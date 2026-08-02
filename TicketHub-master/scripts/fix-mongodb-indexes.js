const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixMongoDBIndexes() {
  try {
    console.log('Fixing MongoDB unique indexes for nullable fields...');
    await prisma.$connect();
    
    // Drop existing unique indexes on nullable fields
    console.log('Dropping existing unique indexes...');
    try {
      await prisma.$runCommandRaw({
        dropIndexes: 'tickets',
        index: 'tickets_stripePaymentId_key'
      });
    } catch (err) {
      console.log('stripePaymentId index may not exist:', err.message);
    }
    
    try {
      await prisma.$runCommandRaw({
        dropIndexes: 'tickets',
        index: 'tickets_stripeSessionId_key'
      });
    } catch (err) {
      console.log('stripeSessionId index may not exist:', err.message);
    }
    
    // Create sparse unique indexes (only index non-null values)
    console.log('Creating sparse unique indexes...');
    
    try {
      await prisma.$runCommandRaw({
        createIndexes: 'tickets',
        indexes: [
          {
            key: { stripePaymentId: 1 },
            name: 'tickets_stripePaymentId_key',
            unique: true,
            sparse: true
          }
        ]
      });
      console.log('✓ Created sparse index for stripePaymentId');
    } catch (err) {
      console.log('Error creating stripePaymentId index:', err.message);
    }
    
    try {
      await prisma.$runCommandRaw({
        createIndexes: 'tickets',
        indexes: [
          {
            key: { stripeSessionId: 1 },
            name: 'tickets_stripeSessionId_key',
            unique: true,
            sparse: true
          }
        ]
      });
      console.log('✓ Created sparse index for stripeSessionId');
    } catch (err) {
      console.log('Error creating stripeSessionId index:', err.message);
    }
    
    console.log('Indexes fixed successfully!');
    
  } catch (error) {
    console.error('Error fixing indexes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMongoDBIndexes();

