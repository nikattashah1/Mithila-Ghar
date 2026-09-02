# LAB 8 — SEARCH ENGINE OPTIMIZATION (SEO)

## Objective
To guarantee maximum indexability, crawl efficiency, and metadata standards so the application ranks appropriately for Terai and Mithila related search queries.

## Requirements
- Dynamic metadata manipulation.
- Clean semantic URLs (Slugs).
- XML Sitemap and Robots.txt.
- "Alt" text on images.

## Tools
- react-helmet-async
- Node.js express-sitemap components

## Implementation & Procedure
1. Incorporated `React-Helmet-Async` in the Main container wrapper to ensure the document `<head>` changes tags when users navigate to specific products or routes.
2. Constructed a backend controller (`sitemap` and `robots` in `miscController.js`) to dynamically read all `Categories` and `Products` slugs to render a valid `sitemap.xml`.
3. Validated `.env` URLs point structurally to `/shop` and `/product/:slug`.
4. Enforced strict accessibility rules across `Home.jsx` and `Shop.jsx`, making sure all `<img>` tags pull the `imageAlt` strings directly off the DB payloads.

*(Insert Screenshots Here: sitemap.xml route rendering, DOM Inspector showing dynamic title tags, Lighthouse SEO score, DOM Alt Text Verification)*

## Result
Bots navigating to `http://localhost:5000/sitemap.xml` receive an up-to-date XML tree. Single Page app routing does not compromise indexing capability thanks to Meta updates.

## Conclusion
Programmatic SEO (creating descriptive slugs and XML sitemaps dynamically based on DB inserts) solves the traditionally poor SEO capability of raw React applications without relying entirely on intense Server Side Rendering.
