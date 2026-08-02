const { PrismaClient } = require('@prisma/client');
const QRCode = require('qrcode');

const prisma = new PrismaClient();

async function generateQRCode(data) {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 1.0,
      margin: 2,
      width: 1000,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      rendererOpts: {
        quality: 1.0,
      },
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

async function regenerateQRCodes() {
  try {
    console.log('Regenerating QR codes with ticket receipt URLs...');
    
    // Read from .env file manually or use default
    let baseUrl = 'http://localhost:3000';
    try {
      const fs = require('fs');
      const path = require('path');
      const envPath = path.join(__dirname, '..', '.env');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/NEXT_PUBLIC_APP_URL=(.+)/);
        if (match) {
          baseUrl = match[1].trim().replace(/^["']|["']$/g, '');
        }
      }
    } catch (e) {
      // Use default if can't read .env
    }
    console.log(`Using base URL: ${baseUrl}`);
    
    // Fetch all tickets that have QR codes
    const tickets = await prisma.ticket.findMany({
      where: {
        qrCodeImage: { not: null },
      },
      select: {
        id: true,
      },
    });

    console.log(`Found ${tickets.length} tickets to regenerate`);

    let updated = 0;
    for (const ticket of tickets) {
      try {
        // Create URL that opens ticket receipt page
        const ticketUrl = `${baseUrl}/tickets/${ticket.id}`;
        console.log(`Updating ticket ${ticket.id} with URL: ${ticketUrl}`);
        
        // Generate new QR code with the URL
        const qrCodeImage = await generateQRCode(ticketUrl);
        
        // Update ticket with new QR code
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { qrCodeImage },
        });
        
        updated++;
        if (updated % 10 === 0) {
          console.log(`Updated ${updated} tickets...`);
        }
      } catch (error) {
        console.error(`Error updating ticket ${ticket.id}:`, error.message);
      }
    }

    console.log(`✓ Successfully regenerated QR codes for ${updated} tickets`);
    console.log(`QR codes now contain URLs like: ${baseUrl}/tickets/{ticketId}`);
    console.log('\nTo test:');
    console.log('1. Open a ticket in your dashboard');
    console.log('2. Scan the QR code with Google Lens');
    console.log('3. It should open the ticket receipt page automatically');
    
  } catch (error) {
    console.error('Error regenerating QR codes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

regenerateQRCodes();

