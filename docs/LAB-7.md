# LAB 7 — DIGITAL MARKETING TOOLS

## Objective
To develop marketing utility models intended to scale newsletter lists, promotions, and corporate engagement.

## Requirements
- Build a marketing subscriber database for newsletters.
- Implement promotional structures for specific seasons.
- Allow users to sign up for Corporate Gifting / B2B inquiries.

## Tools
- React forms
- MongoDB Models (MarketingSubscription, CorporateInquiry)
- Node.js endpoints

## Implementation & Procedure
1. The `Global Footer` prominently maps to different marketing sections, such as "Nepalis Abroad", and "Corporate Gifting".
2. Seed data dynamically inputs dummy sub lists to test the `MarketingSubscription` aggregation later used for Mailchimp integrations.
3. Specialized landing elements point users towards High-Value bundles (Festival/Ritual Kits based around Chhath / Weddings).
4. Created an internal data capture form endpoint (`POST /api/corporate/inquiry`) that deposits B2B requests into the admin purview.

*(Insert Screenshots Here: Custom Promotion Call-to-actions, Newsletter Sign Up form, Corporate Inquiry submission, DB subscriber list)*

## Result
Mithila Ghar functions not just as a store, but a robust pipeline capturing lead generations for enterprise clients and scaling email marketing natively.

## Conclusion
Digital marketing infrastructure embedded directly into the MVC core increases long-term retention via automated subscriber funnels and distinct B2B separation.
