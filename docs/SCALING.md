# Scaling

## 1k organizations / 10k chains

- API: 5-20 stateless replicas
- Worker pools: independently autoscaled by queue depth
- PostgreSQL: primary + read replicas, partition very large block/transaction tables
- Redis: managed Redis with HA
- Object storage: raw block payloads and proof artifacts
- Indexers: chain-sharded workers
- Collaboration projections: per-collaboration queue partitions

## Large histories

Never scan an entire chain on a request. Use:
- checkpoints
- cursor pagination
- indexed block numbers
- confirmation depth
- backfill jobs

## Millions of users

Move authentication to an external OIDC/SAML provider and cache authorization metadata with short TTLs. Keep authoritative membership state in PostgreSQL.

## ZK

Proof generation is always asynchronous. Store proof artifacts in object storage and persist only references/metadata in PostgreSQL where appropriate.
