# LAB 10 — RECOMMENDATION SYSTEM

## Objective
To design a clear, explainable, rule-based product recommendation hierarchy that encourages users to discover related cultural artifacts and complementary foods.

## Requirements
- Provide 'Related Products' based on item configurations.
- Map rules based on 'Tags' and 'Categories'.
- Present to users during their browsing context.

## Tools
- Node.js Controllers
- Mongoose indexing constraints (`popularityScore`, `tags`)

## Implementation & Procedure
1. Altered the Product schema structure to attach `tags` (`festival`, `gift`, `chhath`, `thekua`), `categorySlug`, and a manual `popularityScore`.
2. Created a Recommendation logic flow where querying `GET /api/products?category=...` or `limit=x&sortBy=popularityScore` filters out unrelated contexts instantly.
3. Implemented a "Featured Products" module on `Home.jsx` to parse and push highly rated / high popularity items to the focal point of new customers.
4. Prepared API routes specifically targeting recommendations based on standard cartesian relationships (Same category, overlapping tags, highest rating).

*(Insert Screenshots Here: Home Page Featured Module, Product Detail Reccomendations, "You May Also Like" component)*

## Result
A lightweight recommendation architecture allows products like "Thekua" to organically bubble up associated tags like "Chhath Puja Kit", ensuring maximum user retention and exploration of Mithila culture.

## Conclusion
Rule-based recommendation systems provide highly relevant correlations without the extreme processing overhead associated with neural-network machine learning, perfectly addressing University Project scope requirements.
