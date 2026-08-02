# TicketHub - Kenya's Premier Event Ticketing Platform

A production-grade, enterprise-ready event ticketing platform built with Next.js, MongoDB, and Paystack. Designed specifically for the Kenyan market with modern UI/UX.

![TicketHub](TicketHubV2.png)

## 🚀 Features

### Core Features
- **Event Management** - Create, manage, and track events with rich metadata
- **Ticket Booking** - Secure ticket purchases with Paystack integration
- **QR Code Tickets** - Instant QR code generation for venue entry
- **Real-time Updates** - Live ticket count and availability via WebSocket
- **Role-based Access** - Admin, Organizer, and Attendee dashboards
- **Multi-ticket Events** - Support for different ticket tiers (VIP, Regular, etc.)

### Payment Integration
- **Paystack** - Primary payment gateway (KES currency)
- **Secure Webhooks** - Idempotent payment verification
- **Instant Confirmation** - Real-time payment verification

### Dashboard Features
- **Admin Dashboard** - User management, payouts, platform analytics
- **Organizer Dashboard** - Event management, sales tracking, payout settings
- **Attendee Dashboard** - Ticket management, QR codes, calendar export

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS with custom Kenyan theme
- **Database**: MongoDB with Prisma ORM
- **Authentication**: JWT-based with role management
- **Payments**: Paystack (Kenyan Shillings)
- **Real-time**: Socket.IO for live updates
- **QR Codes**: qrcode library

## 📁 Project Structure

```
TicketHub/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── admin/        # Admin endpoints
│   │   ├── auth/          # Authentication
│   │   ├── events/        # Event CRUD
│   │   ├── owner/         # Organizer endpoints
│   │   ├── paystack/      # Payment integration
│   │   └── tickets/       # Ticket management
│   ├── auth/              # Auth pages
│   ├── dashboard/         # Role-based dashboards
│   ├── events/            # Event browsing
│   └── tickets/           # Ticket pages
├── components/            # React components
├── lib/                   # Utility libraries
│   ├── auth.ts           # Authentication helpers
│   ├── paystack.ts      # Paystack integration
│   ├── socket.ts        # WebSocket setup
│   └── ...
├── prisma/               # Database schema
└── scripts/              # Utility scripts
```

## 🎨 Kenyan Theme Design System

### Color Palette
| Color | Hex | Usage |
|-------|-----|-------|
| Kenyan Black | `#0B0F14` | Primary background |
| Kenyan Red | `#BB1E10` | Accent |
| Kenyan Green | `#006B3C` | Primary accent |
| Kenyan Gold | `#CFAF3F` | Highlights |
| Kenyan Cream | `#F5F7FA` | Text |

### Design Features
- Dark mode first
- Glass morphism effects
- Gradient accents
- Smooth animations
- Mobile-responsive

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB instance
- Paystack account (live/test keys)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-repo/TicketHub.git
cd TicketHub
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure `.env`:
```env
DATABASE_URL=mongodb://localhost:27017/tickethub
JWT_SECRET=your-jwt-secret
PAYSTACK_PUBLIC_KEY=pk_live_xxxxx
PAYSTACK_SECRET_KEY=sk_live_xxxxx
```

5. Generate Prisma client:
```bash
npx prisma generate
```

6. Run the development server:
```bash
npm run dev
```

Visit `http://localhost:3000`

## 🔐 User Roles

| Role | Access |
|------|--------|
| ADMIN | Full platform access, user management, payouts |
| ORGANIZER | Event creation, sales analytics, payout settings |
| EVENT_OWNER | Manage own events |
| ATTENDEE | Browse events, buy tickets, view bookings |
| SCANNER | QR code scanning only |

## 💳 Payment Flow

1. User selects event and ticket quantity
2. System creates PENDING tickets
3. Paystack checkout initiated with KES amount
4. User redirected to Paystack payment page
5. On success, webhook updates ticket to CONFIRMED
6. QR code generated and available in dashboard

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Events
- `GET /api/events` - List events
- `POST /api/events` - Create event (Organizer+)
- `GET /api/events/[id]` - Get event details

### Tickets
- `POST /api/tickets/create` - Create tickets
- `POST /api/tickets/checkout` - Initialize payment
- `GET /api/tickets/my` - User's tickets

### Payments
- `POST /api/paystack/initialize` - Start payment
- `GET /api/paystack/verify/[ref]` - Verify payment
- `POST /api/paystack/webhook` - Payment webhook

## 🔧 Scripts

```bash
# Create admin user
node scripts/create-admin.js

# Reset admin password
node scripts/reset-admin-password.js

# Fix MongoDB indexes
node scripts/fix-mongodb-indexes.js
```

## 📄 License

MIT License - See LICENSE file for details.

## 🙏 Acknowledgments

- Paystack for payment integration
- Next.js team for the amazing framework
- Kenya's event organizers and attendees

---

Built with ❤️ in Kenya 🇰🇪
