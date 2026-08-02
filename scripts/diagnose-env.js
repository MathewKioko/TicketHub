/**
 * Diagnostic script — tests .env connectivity without revealing secrets.
 * Run: node --env-file=.env scripts/diagnose-env.js
 */

const results = []

function check(name, value, show = false) {
  if (!value) {
    results.push(`❌ ${name} — MISSING`)
  } else {
    const preview = show ? value : `${value.slice(0, 8)}...(${value.length} chars)`
    results.push(`✅ ${name} — set (${preview})`)
  }
}

async function main() {
  console.log('=== ENV VAR CHECK ===')
  check('DATABASE_URL', process.env.DATABASE_URL)
  check('JWT_SECRET', process.env.JWT_SECRET)
  check('PAYSTACK_SECRET_KEY', process.env.PAYSTACK_SECRET_KEY)
  check('PAYSTACK_PUBLIC_KEY', process.env.PAYSTACK_PUBLIC_KEY)
  check('NEXT_PUBLIC_APP_URL', process.env.NEXT_PUBLIC_APP_URL, true)

  console.log('\n=== MONGODB CONNECTION TEST ===')
  if (!process.env.DATABASE_URL) {
    console.log('❌ Cannot test — DATABASE_URL missing')
  } else {
    try {
      const url = new URL(process.env.DATABASE_URL)
      const redacted = `${url.protocol}//${url.host}${url.pathname}`
      console.log(`Connecting to: ${redacted}`)

      const { MongoClient } = require('mongodb')
      const client = new MongoClient(process.env.DATABASE_URL, {
        serverSelectionTimeoutMS: 10000,
      })
      await client.connect()
      const dbName = client.db().databaseName || url.pathname.replace('/', '')
      console.log(`✅ MongoDB connected! Database: "${dbName}"`)
      const count = await client.db().collection('users').countDocuments()
      console.log(`✅ Users collection count: ${count}`)
      await client.close()
    } catch (err) {
      console.log(`❌ MongoDB connection FAILED:`)
      console.log(`   ${err.message}`)
      if (err.message.includes('getaddrinfo') || err.message.includes('ENOTFOUND')) {
        console.log('   → Hostname not resolvable. Check the cluster URL.')
      } else if (err.message.includes('Authentication failed')) {
        console.log('   → Bad username/password in DATABASE_URL.')
      } else if (err.message.includes('timed out') || err.message.includes('timedout')) {
        console.log('   → Connection timeout. Likely IP whitelist in MongoDB Atlas → Network Access.')
      }
    }
  }

  console.log('\n=== SUMMARY ===')
  console.log(results.join('\n'))
}

main().finally(() => process.exit(0))

