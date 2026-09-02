# Mithila Ghar

Mithila Ghar is a standalone React/Node.js/MongoDB e-commerce application designed to promote and sell authentic Terai and Mithila culture, food, rituals, art, and crafts.

## Problem Statement
Urban families and Nepalis abroad often find it difficult to obtain authentic Mithila/Terai food and ritual items. Traditional products are scattered, and cultural knowledge is often lost. Mithila Ghar solves this by providing a unified marketplace with cultural guides, bridging the gap between local artisans and consumers.

## Objectives
- Online marketplace for Terai products.
- Digital Wallet and P2P transfers.
- Education via Cultural Guides.
- End-to-end purchasing via simulated Card payments & eSewa Sandbox.
- Admin analytics and digital marketing capabilities.

## Technology Stack
- **Frontend**: React, Vite, Vanilla CSS.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB & Mongoose.

## Installation & Setup

1. Copy `.env.example` to `.env` in the root (if present) or inside `server/.env`.
2. Ensure MongoDB is running locally on port `27017` or update the `MONGODB_URI` inside `server/.env`.
3. Install dependencies:
   ```bash
   npm run install-all
   ```
4. Seed the database (Important for demo accounts):
   ```bash
   npm run seed
   ```
5. Start development servers concurrently:
   ```bash
   npm run dev
   ```

## Demo Accounts (Password for all is `Demo@12345`)
- **Admin**: `admin@mithilaghar.local`
- **Customer 1**: `customer1@mithilaghar.local`
- **Wallet User 1**: `walletuser1@mithilaghar.local`
- **Wallet User 2**: `walletuser2@mithilaghar.local`

## Payment Flows
- **Card**: Choose Card payment, enter any 16 digits, and use the mockup page to simulate success/failure.
- **eSewa Sandbox**: Handled directly in the test environment (must ensure eSewa test secrets are accurate to complete end-to-end sandbox routing).
- **Wallet**: Users can topup or pay instantly via their balance.

## Known Limitations
- Card payment only simulates success/failures via a custom mocked route.
- Subscription logic for the "Culture Box" is conceptual and handled as a one-off product in this build.
"# Mithila-Ghar" 
