# LAB 3 — SHOPPING CART

## Objective
To implement a robust, server-side validated dynamic shopping cart system.

## Requirements
- Core functions: add, remove, increase, decrease, update quantity, and clear cart.
- Server must validate stock limits.
- Node.js/Express backed cart persistence.

## Tools
- React.js (Context API)
- Node.js & Express.js
- MongoDB / Mongoose

## Implementation & Procedure
1. Created a `Cart` Mongoose model linking the user reference, product reference, and quantity.
2. Developed API endpoints inside `cartRoutes.js`: 
   - `GET /api/cart`
   - `PUT /api/cart/:productId`
   - `DELETE /api/cart/:productId`
   - `DELETE /api/cart`
3. The Express controller verifies the user's role and checks the database for `Product.stock` before appending or modifying quantities.
4. Integrated `CartContext.jsx` in the frontend to locally sync cart states with the backend, broadcasting changes to the Header badge.
5. Implemented `Cart.jsx` rendering cart items, allowing UI manipulation of quantity.

*(Insert Screenshots Here: Product Add, Cart view, Quantity increment, Warning for Stock Limit, API Request Evidence/Postman)*

## Result
Cart states seamlessly persist between page reloads, trusting only the backend to accurately compute the Subtotal dynamically.

## Conclusion
Delegating Cart validations completely to the Node.js backend guarantees security and stops frontend manipulation vulnerabilities while maintaining a quick React DOM update logic via Context APIs.
