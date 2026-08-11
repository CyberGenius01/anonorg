# Windows setup

Start Docker Desktop and wait until `docker info` succeeds. Then run:

```powershell
docker info
docker compose up -d postgres redis anvil
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

If `docker info` fails with `dockerDesktopLinuxEngine`, Docker Desktop is installed but its Linux engine/daemon is not running.
