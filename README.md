TicketHub

Problem
Event organizers need a reliable way to sell and validate tickets online
while preventing overselling, duplicate purchases, and ticket fraud.

Solution
TicketHub is a backend-first ticketing system that manages event creation,
ticket inventory, purchases, and validation with consistency guarantees.

Architecture
- API Service (Node.js + TypeScript)
- Database (PostgreSQL / MySQL)
- Payment Integration (mock / real)
- Auth & Access Control

src/
 ├─ modules/
 │   ├─ events/
 │   ├─ tickets/
 │   ├─ orders/
 │   └─ payments/
 ├─ infrastructure/
 │   ├─ db/
 │   ├─ cache/
 │   └─ messaging/
 ├─ shared/
 │   ├─ errors/
 │   ├─ utils/
 │   └─ types/
 ├─ api/
 │   ├─ routes/
 │   └─ controllers/
 └─ index.ts


 Core Concepts
- Events & Ticket Types
- Inventory locking
- Orders & Payments
- Ticket issuance & validation

 Key Design Decisions
 Inventory Management
- How overselling is prevented
- How concurrent purchases are handled

 Payments
- How payment confirmation is handled
- How failed or duplicate payments are handled

 Idempotency
- How duplicate requests are detected

 Security
- Auth strategy
- Ticket validation approach (QR / hash / UUID)

 API Overview
- POST /events
- POST /tickets/purchase
- POST /tickets/validate

 Setup
1. Clone repo
2. Create `.env`
3. Run migrations
4. Start server

 Limitations
- No seat-level selection
- No refunds yet

 Future Improvements
- Webhooks
- Distributed locking
- Event analytics


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

