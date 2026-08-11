const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type Organization = {
  id: string;
  name: string;
  slug: string;
  status: string;
};

export type Me = {
  id: string;
  email: string;
  displayName: string;
};

export type Chain = {
  id: string;
  name: string;
  networkType: string;
  status: string;
  version: string;
  consensus: string;
  blockTimeMs: number;
  createdAt: string;
};

export type GovernanceApproval = {
  id: string;
  approverId: string;
  approved: boolean;
  createdAt: string;
};

export type GovernanceProposal = {
  id: string;
  type: string;
  status: string;
  requiredM: number;
  requiredN: number;
  createdAt: string;
  approvals: GovernanceApproval[];
};

export type Commitment = {
  id: string;
  commitment: string;
  scheme: string;
  visibility: string;
  createdAt: string;
};

export type Collaboration = {
  id: string;
  organizationAId: string;
  organizationBId: string;
  status: string;
  createdAt: string;
};

export type AuditLogEntry = {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  result: string;
  createdAt: string;
};

export class ApiError extends Error {}

export async function apiFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("accessToken");
  const headers = new Headers(init.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  headers.set("Content-Type", "application/json");

  const response = await fetch(`${API}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem("accessToken");
    throw new ApiError("SESSION_EXPIRED");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(body.error ?? `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export function statusTone(status: string): "ok" | "warn" | "bad" | "neutral" | "info" {
  const ok = ["ACTIVE", "RUNNING", "APPROVED", "EXECUTED", "SUCCESS"];
  const warn = ["PENDING", "PROVISIONING", "PROPOSED", "PENDING_ORG_A_APPROVAL", "PENDING_ORG_B_APPROVAL", "PENDING_PLATFORM_APPROVAL", "EXECUTING", "DEGRADED"];
  const bad = ["SUSPENDED", "REJECTED", "FAILED", "REVOKED", "EXPIRED", "DESTROYED", "DENIED", "FAILURE"];

  if (ok.includes(status)) return "ok";
  if (warn.includes(status)) return "warn";
  if (bad.includes(status)) return "bad";
  return "neutral";
}

export function formatLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (Number.isNaN(diffMin)) return iso;
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}d ago`;
}

export function truncateMiddle(value: string, head = 10, tail = 6): string {
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}
