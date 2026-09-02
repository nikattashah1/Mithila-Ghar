# LAB 5 — E-PAYMENT SYSTEMS

## Objective
To implement an internal stored-value Digital Wallet, allowing users to make checkout payments and Peer-to-Peer (P2P) transfers without relying on external bank gateways.

## Requirements
- Maintain a Digital Wallet balance tied to the User.
- Allow users to Top-up balance (simulator context).
- Allow users to Send Money (P2P transfer).
- Persist a Transaction History with different types: TOP_UP, TRANSFER_SENT, TRANSFER_RECEIVED.
- Deny checkout if the balance is less than cart total.

## Tools
- MongoDB (Wallet and WalletTransaction collections)
- Node.js API (`/api/wallet`)
- React.js (`WalletDashboard.jsx`)

## Implementation & Procedure
1. Structured `Wallet` and `WalletTransaction` models to adhere to ACID principles inside Node.js controllers.
2. Built `POST /api/wallet/transfer` with validation checking if sender has enough balance and the recipient exists.
3. Hooked up a Wallet Checkout option in `Checkout.jsx`. When selected, the backend deducts the total from the `Wallet` and writes a `PURCHASE` transaction.
4. Created the frontend `WalletDashboard.jsx` interface, showing live balance, transfer form, and transactional history.

*(Insert Screenshots Here: Wallet Balance, "Send Money", P2P Transfer Success Notification, Sender/Recipient Balance Changes, Transaction History)*

## Result
A unified digital financial sub-system tracks NPR currency amounts securely. Users can pay for their Mithila Ghar cart instantly using stored value.

## Conclusion
A custom-built digital wallet ensures instant, zero-latency checkouts and reduces dependence on third-party aggregators while providing robust payment options to students or those without traditional credit cards.
