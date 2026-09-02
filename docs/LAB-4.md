# LAB 4 — PAYMENT GATEWAY SIMULATION

## Objective
To implement a full simulated transaction flow supporting mock debit/credit card integrations and eSewa sandbox processing.

## Requirements
- Add products, hit checkout, choose payment method.
- Safely route the transaction through Card Mock or eSewa integration.
- Store transactional logic without capturing real PCI tokens.
- Display pass/fail receipts.

## Tools
- React UI Forms
- Express Checkout Controllers
- UUID/Crypto generation
- eSewa Test Merchant codes

## Implementation & Procedure
1. Designed a `Checkout.jsx` page managing the shipping address state and payment preference (Card vs Default Wallet vs eSewa).
2. For Card testing: 
   - Created a custom Mock Form `MockCardTest.jsx`. 
   - User types a mock number, and manually triggers either "Simulate Success" or "Simulate Failure".
   - The frontend calls `POST /api/payments/card/confirm` which validates the order ID and executes db changes.
3. For eSewa testing:
   - When selected, Node.js returns an HTML string for the eSewa EPAY test platform which is written directly to the document to auto-submit parameters (amount, tax, merchant code) to eSewa test APIs.
4. Completed transaction objects are recorded in the `Payment` collection.

*(Insert Screenshots Here: Checkout Payment Method Selection, Mock Card Testing form, eSewa Redirect, Order Success Page)*

## Result
Mithila Ghar effectively processes orders using dynamic mock gateways. Stock quantities are decreased strictly post-payment-success.

## Conclusion
Building mock wrappers around checkout actions enables secure system testing, providing clear insight into webhooks and gateway callback architectures required for real payment platforms.
