TicketHub

 Problem

Event organizers need a reliable way to sell and validate tickets online while preventing:

* Ticket overselling due to concurrent purchases
* Duplicate or replayed payment requests
* Ticket fraud and unauthorized reuse
* Inconsistent states when failures occur (e.g. payment succeeds but ticket issuance fails)

Most simple ticketing systems break under concurrency, retries, or partial failures.


Solution

**TicketHub** is a backend-first ticketing system designed with **consistency, correctness, and real-world failure scenarios** in mind.

It provides APIs for:

* Event and ticket type management
* Controlled ticket inventory
* Purchase processing with idempotency
* Ticket issuance and validation

The system prioritizes **data integrity and predictable behavior over UI complexity**.

---

## High-Level Architecture

```
Client
  |
  v
API Layer (REST)
  |
  v
Domain Modules
  ├─ Events
  ├─ Tickets (Inventory)
  ├─ Orders
  └─ Payments
  |
  v
Database (Transactional)
```

Core Components

* **API Layer** – Handles request validation, authentication, and routing
* **Domain Modules** – Encapsulate business logic per domain
* **Database** – Source of truth for inventory and orders
* **Payment Layer** – Handles payment confirmation (mocked or real)


Core Concepts

Events & Ticket Types

* An event can have multiple ticket types
* Each ticket type has a fixed inventory count

Inventory Control

* Inventory is **transactionally updated**
* Overselling is prevented even under concurrent requests

Orders & Payments

* Ticket purchases create orders
* Orders transition through explicit states:

  * `PENDING`
  * `PAID`
  * `FAILED`
  * `CANCELLED`

Ticket Issuance

* Tickets are issued **only after confirmed payment**
* Each ticket has a unique identifier used for validation



Key Design Decisions

Inventory Management (Overselling Prevention)

To prevent overselling:

* Ticket availability is checked and updated **inside a database transaction**
* Row-level locking or optimistic locking is used during purchase
* Inventory is decremented **only once per successful purchase**

This ensures correctness even when multiple users attempt to buy the last ticket simultaneously.


 Idempotent Purchase Requests

Real systems must handle retries.

TicketHub supports **idempotent purchases**:

* Each purchase request includes an `idempotency_key`
* If the same request is received again, the existing result is returned
* Duplicate orders and double charges are prevented

This is critical for:

* Network retries
* Client-side resubmissions
* Payment provider callbacks

 Payment Handling & Failure Safety

Payment is treated as an **external, unreliable system**.

Scenarios handled:

* Payment succeeds but ticket issuance fails
* Payment callback arrives multiple times
* API crashes mid-flow

Approach:

* Payment confirmation is verified before issuing tickets
* State transitions are explicit and auditable
* Inconsistent states can be retried or reconciled safely

 Ticket Validation & Security

* Each ticket has a unique identifier (UUID / hash)
* Validation checks:

  * Ticket existence
  * Event association
  * Usage status
* Used tickets are marked and cannot be reused

This prevents:

* Ticket duplication
* Replay attacks
* Unauthorized access

---

## API Overview (Simplified)

### Create Event

```
POST /events
```

### Purchase Ticket

```
POST /tickets/purchase
Headers:
  Idempotency-Key: <uuid>
```

### Validate Ticket

```
POST /tickets/validate
```

---

## Tech Stack

* **Language:** TypeScript
* **Runtime:** Node.js
* **API:** REST
* **Database:** SQL (PostgreSQL / MySQL)
* **ORM / Query Layer:** (Specify if used)
* **Testing:** Jest (or equivalent)

---

## Setup

```bash
git clone https://github.com/MathewKioko/TicketHub.git
cd TicketHub

cp .env.example .env
npm install
npm run migrate
npm run dev
```

---

Failure Scenarios & Behavior

| Scenario                           | Behavior                                 |
| ---------------------------------- | ---------------------------------------- |
| Duplicate purchase request         | Existing order returned                  |
| Concurrent purchase of last ticket | Only one succeeds                        |
| Payment success, issuance failure  | Order remains consistent, retry possible |
| API crash mid-request              | Transaction rollback                     |

 Limitations

* No seat-level allocation
* No refunds or cancellations
* Single-instance deployment (no distributed locks yet)

Future Improvements

* Distributed locking for horizontal scaling
* Payment webhooks with signature verification
* Refund and cancellation flows
* Event analytics and reporting
* QR-based ticket scanning service

Why This Project Exists

TicketHub is intentionally backend-focused.

It exists to demonstrate:

* System design thinking
* Data consistency handling
* Real-world failure awareness
* Maintainable backend architecture

UI simplicity is a conscious tradeoff.

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

