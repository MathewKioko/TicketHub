/**
 * Local development seed for TicketHub.
 *
 * Creates three demo accounts (password for all of them: `TicketDemo123!`) plus
 * a realistic set of events, tickets and payouts so the UI can be exercised
 * end to end without live payment credentials.
 *
 * Run with:  node scripts/seed-demo.mjs
 * Requires a MongoDB replica set (see .env.local).
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const PASSWORD = 'TicketDemo123!'
const day = 24 * 60 * 60 * 1000

function at(daysFromNow, hour) {
  const d = new Date(Date.now() + daysFromNow * day)
  d.setHours(hour, 0, 0, 0)
  return d
}

const artwork = (seed) => `https://picsum.photos/seed/${seed}/1400/1050`

async function main() {
  const password = await bcrypt.hash(PASSWORD, 12)

  const admin = await prisma.user.create({
    data: {
      email: 'admin@tickethub.test',
      name: 'Amina Otieno',
      role: 'ADMIN',
      verified: true,
      password,
    },
  })

  const organizer = await prisma.user.create({
    data: {
      email: 'organizer@tickethub.test',
      name: 'Sauti Sessions',
      role: 'EVENT_OWNER',
      verified: true,
      password,
      organizerRequestStatus: 'approved',
      organizerApprovedAt: new Date(),
      eventOwnerProfile: {
        create: {
          paystackSubaccountId: 'ACCT_demo_subaccount',
          paystackBusinessName: 'Sauti Sessions Ltd',
          paystackSettledBank: 'Equity Bank',
          paystackAccountNumber: '0170293847561',
          paystackSplitRatio: 7,
          bankVerified: true,
          documentsVerified: true,
          autoPayout: true,
          payoutSchedule: 'weekly',
          totalRevenue: 948000,
          totalPayouts: 620000,
          pendingPayouts: 328000,
        },
      },
    },
  })

  const attendee = await prisma.user.create({
    data: {
      email: 'attendee@tickethub.test',
      name: 'Wanjiru Kamau',
      role: 'ATTENDEE',
      verified: true,
      password,
    },
  })

  const scanner = await prisma.user.create({
    data: {
      email: 'door@tickethub.test',
      name: 'Brian Mwangi',
      role: 'SCANNER',
      verified: true,
      password,
    },
  })

  const definitions = [
    {
      title: 'Blankets & Wine',
      description:
        'An afternoon of live afro-soul on the lawn. Bring a blanket, a picnic and friends; the line-up runs from 3pm to sunset with two stages and a food court.',
      venue: 'Karen Country Club, Nairobi',
      date: at(3, 15),
      category: 'Music',
      basePrice: 3000,
      totalTickets: 400,
      sold: 86,
      imageUrl: artwork('blanketswine'),
    },
    {
      title: 'Nai Fest',
      description:
        'Two nights of gengetone, drill and afrobeats across three stages at the Ngong Road grounds, with a late licence until 2am.',
      venue: 'Ngong Road Grounds, Nairobi',
      date: at(5, 20),
      category: 'Music',
      basePrice: 2500,
      totalTickets: 1500,
      sold: 240,
      imageUrl: artwork('naifest'),
    },
    {
      title: 'Laughing Matter',
      description:
        'A stand-up night with six comics, two of them on their first Nairobi set. Doors at 7pm, first act at 8pm sharp.',
      venue: 'Alliance Française, Nairobi',
      date: at(8, 19),
      category: 'Comedy',
      basePrice: 1500,
      totalTickets: 180,
      sold: 0,
      imageUrl: artwork('comedy'),
    },
    {
      title: 'Kenya Fintech Forum',
      description:
        'One day, four tracks: payments infrastructure, credit scoring, open banking and regulation. Lunch and the closing reception are included.',
      venue: 'KICC, Nairobi',
      date: at(12, 8),
      category: 'Business',
      basePrice: 6500,
      totalTickets: 300,
      sold: 41,
      imageUrl: artwork('fintech'),
    },
    {
      title: 'Nairobi Art Weekend',
      description:
        'Forty studios and galleries open their doors for one weekend, with a single wristband covering every venue and the Saturday talks programme.',
      venue: 'Westlands, Nairobi',
      date: at(18, 10),
      category: 'Culture',
      basePrice: 1200,
      totalTickets: 800,
      sold: 12,
      imageUrl: artwork('artweekend'),
    },
    {
      title: 'Sarabi Sessions #14',
      description:
        'A finished night of live benga and taarab in a 120-capacity room. Recordings from the night are shared with ticket holders.',
      venue: 'Sarabi, Kilimani',
      date: at(-24, 20),
      category: 'Music',
      basePrice: 2000,
      totalTickets: 120,
      sold: 120,
      status: 'COMPLETED',
      imageUrl: artwork('sarabi'),
    },
    {
      title: 'Poetry at the GoDown',
      description:
        'An evening of spoken word in the courtyard, with an open mic for the last hour.',
      venue: 'The GoDown Arts Centre, Nairobi',
      date: at(-51, 18),
      category: 'Culture',
      basePrice: 1000,
      totalTickets: 200,
      sold: 137,
      status: 'COMPLETED',
      imageUrl: artwork('godown'),
    },
  ]

  const created = []
  for (const definition of definitions) {
    const { sold, ...rest } = definition
    const event = await prisma.event.create({
      data: {
        ...rest,
        status: rest.status ?? 'PUBLISHED',
        currency: 'KES',
        organizerId: organizer.id,
        ticketsSold: sold,
        totalRevenue: sold * rest.basePrice,
        isFeatured: definition.title === 'Blankets & Wine',
      },
    })
    created.push({ event, sold })
  }

  // Seat the attendee and a crowd of other buyers so sold counts look real.
  const crowd = await Promise.all(
    Array.from({ length: 6 }).map((_, index) =>
      prisma.user.create({
        data: {
          email: `buyer${index + 1}@tickethub.test`,
          name: ['Kevin Odhiambo', 'Faith Njeri', 'Sam Kiptoo', 'Achieng Were', 'Tom Gitau', 'Naomi Chebet'][index],
          role: 'ATTENDEE',
          verified: true,
        },
      })
    )
  )

  for (const [eventIndex, entry] of created.entries()) {
    for (let index = 0; index < entry.sold; index += 1) {
      const holder = index === 0 ? attendee : crowd[index % crowd.length]
      const status = entry.event.status === 'COMPLETED' ? 'CHECKED_IN' : 'CONFIRMED'
      const ticket = await prisma.ticket.create({
        data: {
          eventId: entry.event.id,
          userId: holder.id,
          status,
          price: entry.event.basePrice,
          quantity: 1,
          qrCodeData: `/tickets/${entry.event.id}:${eventIndex}:${index}`,
          checkedInAt: status === 'CHECKED_IN' ? at(-24, 21) : null,
          createdAt: at(-(eventIndex + 3), 12),
        },
      })

      if (status === 'CHECKED_IN') {
        await prisma.checkIn.create({
          data: {
            ticketId: ticket.id,
            eventId: entry.event.id,
            checkedInAt: at(-24, 21),
            scannerId: null,
          },
        })
      }
    }
  }

  // Wallet states that are otherwise unreachable in a fresh database.
  const upcoming = created[0].event
  const pendingEvent = created[2].event
  await prisma.ticket.create({
    data: {
      eventId: upcoming.id,
      userId: attendee.id,
      status: 'CHECKED_IN',
      price: upcoming.basePrice,
      quantity: 2,
      qrCodeData: `/tickets/${upcoming.id}:attendee:checked`,
      checkedInAt: at(3, 16),
    },
  })
  await prisma.ticket.create({
    data: {
      eventId: pendingEvent.id,
      userId: attendee.id,
      status: 'PENDING',
      price: pendingEvent.basePrice,
      quantity: 1,
      qrCodeData: `/tickets/${pendingEvent.id}:attendee:pending`,
      paystackReference: 'PSK_DEMO_PENDING',
    },
  })

  for (const [index, status] of ['COMPLETED', 'PENDING', 'PROCESSING'].entries()) {
    await prisma.payout.create({
      data: {
        eventOwnerId: organizer.id,
        amount: [310000, 218000, 96000][index],
        grossAmount: [333000, 234000, 103000][index],
        platformFee: [23000, 16000, 7000][index],
        netAmount: [310000, 218000, 96000][index],
        status,
        reference: `PO_DEMO_${index + 1}`,
        bankName: 'Equity Bank',
        accountNumber: '0170293847561',
        accountName: 'Sauti Sessions Ltd',
        processedAt: status === 'COMPLETED' ? at(-12, 9) : null,
      },
    })
  }

  console.log(`
Seeded TicketHub demo data.

  Admin       admin@tickethub.test      / ${PASSWORD}
  Organizer   organizer@tickethub.test  / ${PASSWORD}
  Attendee    attendee@tickethub.test   / ${PASSWORD}
  Door staff  door@tickethub.test       / ${PASSWORD}

  Events: ${created.length}   Scanner user id: ${scanner.id}
  Attendee id: ${attendee.id}
  Admin id: ${admin.id}
`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
