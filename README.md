# Ticket Hub — The Future of Event Management

Ticket Hub is a modern platform that lets users discover, book, and attend events with ease

## Features

### For Attendees
- 🔍 Discover events by category, date, and location
- 💳 Secure ticket purchases via Stripe
- 📱 QR-code e-tickets
- ✅ Instant check-in using mobile scanner

### For Organizers
- 🎫 Create and manage events
- 🎨 Design custom 3D seat maps
- 💰 Manage ticket sales and pricing
- 📊 Real-time attendance tracking

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB with Prisma ORM
- **Payments**: Stripe
- **3D Graphics**: Three.js with React Three Fiber
- **Real-time**: Socket.io
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB database (local or MongoDB Atlas)
- Stripe account (for payment processing)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your MongoDB connection string, Stripe keys, and JWT secret.
   
   MongoDB connection string format:
   ```
   DATABASE_URL="mongodb://localhost:27017/tickethub"
   ```
   Or for MongoDB Atlas:
   ```
   DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/tickethub"
   ```

4. Set up the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
Ticket Hub/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/             # React components
│   ├── events/            # Event-related components
│   ├── seats/             # Seat map components
│   ├── tickets/           # Ticket components
│   └── ui/                # Reusable UI components
├── lib/                   # Utility functions
│   ├── auth.ts            # Authentication helpers
│   ├── stripe.ts          # Stripe integration
│   └── db.ts              # Database client
├── prisma/                # Database schema
└── public/                # Static assets
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:studio` - Open Prisma Studio
- `npm run db:push` - Push schema changes to database

## License

MIT

