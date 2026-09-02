# LAB 9 — SEO & ANALYTICS

## Objective
To track in-house user events mapping user behaviour and popular items without exporting PI to third-party services in order to formulate future business logic.

## Requirements
- Track page views, specific product views, searches, and cart additions.
- Expose analytics in the Admin Dashboard.
- Analyze "Popular" categories based on actual interactions.

## Tools
- MongoDB (AnalyticsEvent Collection)
- Node API endpoints

## Implementation & Procedure
1. Formed an `AnalyticsEvent` mongooose collection with ENUM definitions for (`product_view`, `category_view`, `add_to_cart`, `checkout_started`).
2. Engineered the `adminController.js` to run heavy MongoDB aggregation pipelines matching against real User, Order, and Revenue parameters.
3. Created the `AdminDashboard.jsx` interface on the React client. Utilizing `useEffect()`, the Admin panel loads real-time stats including total active sales and user counts based on analytics intersections.
4. Tied specific API controllers to automatically drop internal view logs without halting the user process (using non-blocking `Event.create()`).

*(Insert Screenshots Here: Admin Dashboard Total Revenue, Event Logs in DB, Product View increment)*

## Result
Administrators can clearly review which Categories perform the best, providing concrete metrics for scaling the inventory.

## Conclusion
First-party analytics provides stronger security for customers while delivering actionable insight to the Mithila Ghar administrative staff, proving functionality of big-data paradigms even in isolated test platforms.
