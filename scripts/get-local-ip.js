const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  return 'localhost';
}

const localIP = getLocalIP();
console.log(`\nYour local IP address is: ${localIP}`);
console.log(`\nUpdate your .env file with:`);
console.log(`NEXT_PUBLIC_APP_URL=http://${localIP}:3000`);
console.log(`\nThen run: node scripts/regenerate-qr-codes.js`);
console.log(`\nMake sure your dev server is running with:`);
console.log(`npm run dev -- -H ${localIP}`);
console.log(`\nOr if using Next.js 14+, update package.json dev script to:`);
console.log(`"dev": "next dev -H 0.0.0.0"`);
console.log(`\nThis will allow access from mobile devices on your network.\n`);

