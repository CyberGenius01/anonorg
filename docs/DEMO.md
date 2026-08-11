# Demo

1. Start PostgreSQL, Redis and Anvil.
2. Run migrations and seed.
3. Log in as `org_a-owner-1@local.test`.
4. Inspect organizations.
5. Create a chain proposal.
6. Approve it using two distinct Org A owner accounts.
7. Worker provisions the local chain.
8. Create a Poseidon commitment.
9. Create a collaboration with Org B and enable `READ_BLOCKS` + `READ_COMMITMENTS`.
10. Approve the collaboration from both organizations.
11. Worker creates filtered collaboration block views.
12. Confirm Org B cannot read Org A private commitments unless explicitly projected.

The ZK layer is intentionally provider-based: register a real audited circuit and verifier before using production proofs.
