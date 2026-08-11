# Threat Model

## Assets

- Organization private data
- Commitment secrets and nonces
- KMS/HSM references
- Governance authority
- Chain credentials
- Audit records
- Collaboration policies

## Threats

### IDOR / tenant escape
Mitigation: authenticated principal + organization membership check + resource ownership query.

### Privilege escalation
Mitigation: RBAC, explicit permissions, owner threshold governance, deny-by-default.

### Replay
Mitigation: idempotency keys, blockchain nonce tracking, proposal uniqueness and expiry.

### Cache poisoning
All cache keys must include organization and resource identity.

### WebSocket leakage
Socket subscriptions must re-run collaboration/resource authorization.

### Reorg
Indexer must wait for configurable confirmation depth and reconcile parent hashes.

### Key compromise
Application stores only secret references; signing should occur in KMS/HSM.

### Sensitive logging
Never log private inputs, private keys, tokens, proof witnesses, or raw transaction payloads unless explicitly classified safe.

## Production requirements

- managed KMS/HSM
- TLS everywhere
- database encryption
- secrets manager
- WAF/rate limiting
- audited Solidity contracts
- independently audited ZK circuits
- security incident response and key rotation runbooks
