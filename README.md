# Enterprise Multi-Tenant Blockchain PaaS

A production-oriented TypeScript monorepo for a multi-tenant Blockchain Platform-as-a-Service with:

- 5-owner / 3-of-5 platform governance
- 3-owner / 2-of-3 organization governance
- strict tenant-scoped authorization
- PostgreSQL + Prisma
- Redis + BullMQ asynchronous jobs
- blockchain adapter with local Anvil development support
- Poseidon-based commitments
- pluggable ZK proof provider / circuit registry
- cross-organization collaboration with explicit permissions
- filtered shared-block projections
- audit logging
- OpenTelemetry-ready request tracing
- Docker Compose local development
- Solidity governance/registry contracts
- Next.js dashboard foundation
- integration/security test scaffolding

The design is based on the supplied platform specification. fileciteturn0file0

## Stack

- Node.js 22 + TypeScript
- pnpm workspaces
- Fastify
- Prisma + PostgreSQL
- Redis + BullMQ
- Next.js + React
- viem
- Solidity + Hardhat
- Zod
- Vitest

## Quick start

```bash
cp .env.example .env
pnpm install
docker compose up -d postgres redis anvil
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

API: http://localhost:4000
Web: http://localhost:3000
Anvil RPC: http://localhost:8545

## Important

This repository is intentionally structured around production boundaries, but production deployment still requires configuring a real KMS/HSM, identity provider, TLS, managed PostgreSQL/Redis, durable object storage, blockchain nodes, secrets management, and audited ZK circuits.

Never place real private keys in `.env` in production.


## Windows Docker note

Docker Desktop must be running before `docker compose up`. Verify:

```powershell
docker info
```

If you see `dockerDesktopLinuxEngine ... The system cannot find the file specified`, Docker Desktop is installed but its Linux engine is not running yet. Start Docker Desktop, wait for it to report that Docker is running, then retry.

