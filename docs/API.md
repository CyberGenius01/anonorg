# API v1

## Authentication

`POST /api/v1/auth/login`

```json
{"email":"org_a-owner-1@local.test","password":"ChangeMe123!"}
```

Returns a short-lived JWT.

## Organizations

`GET /api/v1/organizations`

Returns only organizations accessible to the principal.

## Chains

`GET /api/v1/organizations/:orgId/chains`

`POST /api/v1/organizations/:orgId/chains`

Creating a chain creates a governance proposal and queues provisioning. HTTP never waits for infrastructure creation.

## Commitments

`POST /api/v1/organizations/:orgId/commitments`

Raw private data is used only to derive the commitment and is not persisted.

## Governance

`GET /api/v1/organizations/:orgId/governance`

`POST /api/v1/governance/:proposalId/approve`

## Collaboration

`POST /api/v1/collaborations`

`GET /api/v1/collaborations/:id/blocks`

Collaboration access is valid only when the principal belongs to either participating organization or is a platform owner.
