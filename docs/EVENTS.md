# Event Contract

All asynchronous events should carry:

```json
{
  "eventId": "uuid",
  "eventType": "BlockIndexed",
  "occurredAt": "ISO-8601",
  "requestId": "uuid",
  "traceId": "otel-trace-id",
  "organizationId": "org_a",
  "resourceId": "chain_123",
  "schemaVersion": 1,
  "payload": {}
}
```

Required events:
- ChainCreated
- ChainProvisioningStarted
- ChainProvisioningCompleted
- CommitmentCreated
- ProofGenerated
- ProofVerified
- CollaborationRequested
- CollaborationApproved
- CollaborationActivated
- BlockCreated
- BlockIndexed
- BlockShared

Consumers must be idempotent.
