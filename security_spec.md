# Security Specification for KhetNet

## Data Invariants
- A product must belong to a farmer in the same region/state.
- An order must have a valid product ID and the wholesaler must be in the same region (optional, but preferred for local market).
- Only farmers can create products.
- Only wholesalers can create orders.
- Only involved parties (farmer/wholesaler) can chat or view order details.
- Stock quantity cannot go below 0.

## The Dirty Dozen Payloads

1. **Attempt to create a product as a wholesaler.**
2. **Attempt to create a product with someone else's farmerId.**
3. **Attempt to update someone else's product stock.**
4. **Attempt to create an order for a quantity greater than available.** (Managed by client batch, but rules should ideally check existsAfter if possible, though rules can't easily check 'sum' across documents easily without transactions).
5. **Attempt to approve an order as the wholesaler.**
6. **Attempt to send a chat message to an order you aren't part of.**
7. **Attempt to delete the 'admin' user profile as a regular user.**
8. **Attempt to update your own role to 'host' in your user profile.**
9. **Attempt to read all users' PII (mobile/email) as a regular user.**
10. **Attempt to inject a 1MB junk string into a product name.**
11. **Attempt to spoof 'email_verified' in auth token.**
12. **Attempt to delete a product that has active orders.** (Soft delete or rule restriction).

## The Test Runner (Conceptual)
Verified manually via the logic gates in the rules draft.
