"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError, Me, Organization, apiFetch } from "./api";
import {
  AuditIcon,
  ChainIcon,
  ChevronDownIcon,
  CollabIcon,
  DashboardIcon,
  GovernanceIcon,
  LogoMarkIcon,
  OrgIcon,
  PrivacyIcon,
} from "./icons";
import {
  AuditSection,
  BlockchainSection,
  CollaborationSection,
  DashboardSection,
  GovernanceSection,
  OrganizationsSection,
  PrivacySection,
} from "./sections";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type ViewId =
  | "dashboard"
  | "organizations"
  | "blockchain"
  | "privacy"
  | "collaboration"
  | "governance"
  | "audit";

const NAV_ITEMS: { id: ViewId; label: string; icon: typeof DashboardIcon }[] = [
  { id: "dashboard", label: "Dashboard", icon: DashboardIcon },
  { id: "organizations", label: "Organizations", icon: OrgIcon },
  { id: "blockchain", label: "Blockchain", icon: ChainIcon },
  { id: "privacy", label: "Privacy", icon: PrivacyIcon },
  { id: "collaboration", label: "Collaboration", icon: CollabIcon },
  { id: "governance", label: "Governance", icon: GovernanceIcon },
  { id: "audit", label: "Audit", icon: AuditIcon },
];

const VIEW_COPY: Record<ViewId, { eyebrow: string; title: string; subtitle: string }> = {
  dashboard: {
    eyebrow: "PLATFORM",
    title: "Control Plane",
    subtitle: "An overview of your account and tenant memberships across ChainForge.",
  },
  organizations: {
    eyebrow: "TENANTS",
    title: "Organizations",
    subtitle: "Every organization you belong to, and which one is currently in scope.",
  },
  blockchain: {
    eyebrow: "INFRASTRUCTURE",
    title: "Blockchain",
    subtitle: "Provisioned chains for the selected organization, and new chain proposals.",
  },
  privacy: {
    eyebrow: "ZERO-KNOWLEDGE",
    title: "Privacy",
    subtitle: "Poseidon commitments that keep tenant data confidential on shared infrastructure.",
  },
  collaboration: {
    eyebrow: "CROSS-TENANT",
    title: "Collaboration",
    subtitle: "Scoped, permissioned data sharing agreements between organizations.",
  },
  governance: {
    eyebrow: "M-OF-N SIGN-OFF",
    title: "Governance",
    subtitle: "Review and approve proposals that require multi-party consent.",
  },
  audit: {
    eyebrow: "COMPLIANCE",
    title: "Audit",
    subtitle: "A chronological record of actions taken within this organization.",
  },
};

export default function Home() {
  const [me, setMe] = useState<Me | null>(null);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<ViewId>("dashboard");
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);

  useEffect(() => {
    async function loadSession() {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const [meData, organizations] = await Promise.all([
          apiFetch<Me>("/api/v1/me"),
          apiFetch<Organization[]>("/api/v1/organizations"),
        ]);

        setMe(meData);
        const orgList = Array.isArray(organizations) ? organizations : [];
        setOrgs(orgList);
        if (orgList.length > 0) setActiveOrgId(orgList[0].id);
      } catch (err) {
        localStorage.removeItem("accessToken");
        setMe(null);
        setOrgs([]);

        if (err instanceof ApiError && err.message !== "SESSION_EXPIRED") {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, []);

  async function demoLogin() {
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "org_a-owner-1@local.test",
          password: "ChangeMe123!",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.accessToken) {
        throw new ApiError(data.error ?? "LOGIN_FAILED");
      }

      localStorage.setItem("accessToken", data.accessToken);

      // Do not manually construct auth state.
      // Reload so the normal authenticated bootstrap runs.
      window.location.reload();
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "LOGIN_FAILED");
    }
  }

  function logout() {
    localStorage.removeItem("accessToken");
    setMe(null);
    setOrgs([]);
    setActiveOrgId(null);
    setError("");
    setView("dashboard");
  }

  const activeOrg = useMemo(() => orgs.find((o) => o.id === activeOrgId) ?? null, [orgs, activeOrgId]);
  const copy = VIEW_COPY[view];

  if (loading) {
    return (
      <div className="boot-screen">
        <span className="spinner" />
        Loading ChainForge...
      </div>
    );
  }

  return (
    <main>
      <aside>
        <div className="brand">
          <div className="brand-mark">
            <LogoMarkIcon />
          </div>
          <div className="brand-text">
            <h1>ChainForge</h1>
            <p>Multi-tenant Blockchain PaaS</p>
          </div>
        </div>

        {me && (
          <nav aria-label="Primary">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  aria-current={view === item.id ? "page" : undefined}
                >
                  <Icon />
                  {item.label}
                </button>
              );
            })}
          </nav>
        )}

        <div className="nav-spacer" />

        {me && (
          <div className="sidebar-foot">
            <span className="pulse-dot" />
            API connected
          </div>
        )}
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <small>{copy.eyebrow}</small>
            <h2>{copy.title}</h2>
            <p className="subtitle">{copy.subtitle}</p>
          </div>

          <div className="topbar-actions">
            {me && orgs.length > 0 && (
              <div className="org-switch">
                <button className="org-switch-btn" onClick={() => setOrgMenuOpen((v) => !v)}>
                  {activeOrg ? activeOrg.name : "Select organization"}
                  <ChevronDownIcon />
                </button>
                {orgMenuOpen && (
                  <div className="org-switch-menu">
                    {orgs.map((org) => (
                      <button
                        key={org.id}
                        onClick={() => {
                          setActiveOrgId(org.id);
                          setOrgMenuOpen(false);
                        }}
                      >
                        {org.name}
                        {org.id === activeOrgId && <span>✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {me ? (
              <button className="btn-ghost" onClick={logout}>Logout</button>
            ) : (
              <button className="btn-accent" onClick={demoLogin}>Demo Login</button>
            )}
          </div>
        </header>

        {error && <div className="error">⚠ {error}</div>}

        {!me ? (
          <div className="auth-screen">
            <div className="card auth-card">
              <h3>Enterprise Blockchain Control Plane</h3>
              <p>
                Authenticate with the seeded Organization A owner to explore
                tenant isolation, governance, chains and collaboration.
              </p>
              <button className="btn-accent" onClick={demoLogin}>
                Login as Organization A Owner
              </button>
              <div className="cred-hint">org_a-owner-1@local.test</div>
            </div>
          </div>
        ) : (
          <>
            {view === "dashboard" && <DashboardSection me={me} orgs={orgs} />}
            {view === "organizations" && (
              <OrganizationsSection orgs={orgs} activeOrgId={activeOrgId} onSelect={setActiveOrgId} />
            )}
            {view === "blockchain" && <BlockchainSection orgId={activeOrgId} />}
            {view === "privacy" && <PrivacySection orgId={activeOrgId} />}
            {view === "collaboration" && <CollaborationSection orgId={activeOrgId} orgs={orgs} />}
            {view === "governance" && <GovernanceSection orgId={activeOrgId} me={me} />}
            {view === "audit" && <AuditSection orgId={activeOrgId} />}
          </>
        )}
      </section>
    </main>
  );
}
