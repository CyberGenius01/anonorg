# Production Security Checklist

- [ ] Replace local JWT auth with OIDC/SAML provider.
- [ ] Configure asymmetric signing keys and key rotation.
- [ ] Put all signing keys behind KMS/HSM.
- [ ] Enable PostgreSQL TLS and encryption at rest.
- [ ] Add PostgreSQL RLS policies for organization-owned tables in production.
- [ ] Add Redis ACLs/TLS.
- [ ] Configure API WAF and distributed rate limiting.
- [ ] Add request idempotency middleware to mutating endpoints.
- [ ] Add WebSocket authorization middleware.
- [ ] Add CSRF protection for cookie-based browser sessions.
- [ ] Add reorg-aware indexer checkpoints.
- [ ] Add dead-letter queues and operator dashboards.
- [ ] Audit Solidity contracts.
- [ ] Audit ZK circuits.
- [ ] Run dependency and container vulnerability scans.
- [ ] Run IDOR and privilege-escalation tests against every organization route.
