"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  ApiError,
  AuditLogEntry,
  Chain,
  Collaboration,
  Commitment,
  GovernanceProposal,
  Me,
  Organization,
  apiFetch,
  formatLabel,
  formatRelativeTime,
  statusTone,
  truncateMiddle,
} from "./api";
import { useResource } from "./useResource";
import { LockIcon, PlusIcon } from "./icons";

function Badge({ status }: { status: string }) {
  return <span className={`badge ${statusTone(status)}`}>{formatLabel(status)}</span>;
}

function SkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <div className="row" key={i}>
          <div className="row-main" style={{ width: "60%" }}>
            <div className="skel skel-line" style={{ width: "70%" }} />
            <div className="skel skel-line" style={{ width: "40%" }} />
          </div>
          <div className="skel skel-line" style={{ width: 70, height: 20 }} />
        </div>
      ))}
    </div>
  );
}

function InlineError({ message }: { message: string }) {
  return <div className="error">⚠ {formatLabel(message)}</div>;
}

/* ---------------------------------------------------------------- */
/* Dashboard                                                          */
/* ---------------------------------------------------------------- */

export function DashboardSection({ me, orgs }: { me: Me; orgs: Organization[] }) {
  const activeOrgs = orgs.filter((o) => o.status === "ACTIVE").length;

  return (
    <>
      <div className="grid">
        <div className="card stat">
          <small>USER</small>
          <strong style={{ fontSize: 18 }}>{me.displayName}</strong>
          <span className="hint">{me.email}</span>
        </div>

        <div className="card stat">
          <small>ORGANIZATIONS</small>
          <strong>{orgs.length}</strong>
          <span className="hint">{activeOrgs} active tenant{activeOrgs === 1 ? "" : "s"}</span>
        </div>

        <div className="card stat">
          <small>GOVERNANCE</small>
          <strong>2-of-3</strong>
          <span className="hint">Organization critical actions</span>
        </div>

        <div className="card stat">
          <small>PLATFORM</small>
          <strong>3-of-5</strong>
          <span className="hint">Platform critical actions</span>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h3>Organizations</h3>
            <p>Tenants you currently hold membership in</p>
          </div>
        </div>

        {orgs.length === 0 ? (
          <div className="empty">No organizations available.</div>
        ) : (
          orgs.map((org) => (
            <div className="row" key={org.id}>
              <div className="row-main">
                <b>{org.name}</b>
                <span className="meta">{org.slug}</span>
              </div>
              <Badge status={org.status} />
            </div>
          ))
        )}
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- */
/* Organizations                                                      */
/* ---------------------------------------------------------------- */

export function OrganizationsSection({
  orgs,
  activeOrgId,
  onSelect,
}: {
  orgs: Organization[];
  activeOrgId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h3>Tenant memberships</h3>
          <p>Select an organization to scope Blockchain, Privacy, Collaboration and Governance views</p>
        </div>
      </div>

      {orgs.length === 0 ? (
        <div className="empty">No organizations available.</div>
      ) : (
        orgs.map((org) => (
          <div className="row" key={org.id}>
            <div className="row-main">
              <b>{org.name}</b>
              <span className="meta">{org.id}</span>
            </div>
            <div className="row-side">
              <Badge status={org.status} />
              <button
                className="btn-ghost btn-sm"
                onClick={() => onSelect(org.id)}
                aria-pressed={org.id === activeOrgId}
              >
                {org.id === activeOrgId ? "Selected" : "Select"}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Shared: org-required empty state                                   */
/* ---------------------------------------------------------------- */

function NoOrgSelected() {
  return (
    <div className="card">
      <div className="empty">
        Select an organization from the switcher above, or from the
        Organizations tab, to view this section.
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Blockchain                                                         */
/* ---------------------------------------------------------------- */

const CONSENSUS_OPTIONS = ["POA", "IBFT", "QBFT", "POS"];

export function BlockchainSection({ orgId }: { orgId: string | null }) {
  const { data: chains, loading, error, reload } = useResource<Chain[]>(
    orgId ? `/api/v1/organizations/${orgId}/chains` : null,
    [orgId]
  );
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!orgId) return;

    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    setFormError("");
    setNotice("");

    try {
      const res = await apiFetch<{ proposalId: string; status: string }>(
        `/api/v1/organizations/${orgId}/chains`,
        {
          method: "POST",
          body: JSON.stringify({
            name: form.get("name"),
            chainId: form.get("chainId"),
            consensus: form.get("consensus"),
            networkType: "EVM",
            blockTimeMs: Number(form.get("blockTimeMs")),
            version: form.get("version"),
          }),
        }
      );
      setNotice(`Provisioning proposal submitted (${formatLabel(res.status)}). Approve it from the Governance tab.`);
      setShowForm(false);
      reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "REQUEST_FAILED");
    } finally {
      setSubmitting(false);
    }
  }

  if (!orgId) return <NoOrgSelected />;

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h3>Chains</h3>
          <p>Networks provisioned for this organization</p>
        </div>
        <button className="btn-accent" onClick={() => setShowForm((v) => !v)}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <PlusIcon style={{ width: 14, height: 14 }} />
            New chain
          </span>
        </button>
      </div>

      {notice && <div className="notice">✓ {notice}</div>}

      {showForm && (
        <form className="stack" onSubmit={handleSubmit} style={{ marginBottom: 18, paddingBottom: 18, borderBottom: "1px solid var(--border-0)" }}>
          {formError && <InlineError message={formError} />}
          <div className="field-row">
            <div className="field">
              <label htmlFor="chain-name">Name</label>
              <input id="chain-name" name="name" required maxLength={120} placeholder="org-a-mainnet" />
            </div>
            <div className="field">
              <label htmlFor="chain-id">Chain ID</label>
              <input id="chain-id" name="chainId" required inputMode="numeric" placeholder="14071" />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="consensus">Consensus</label>
              <select id="consensus" name="consensus" defaultValue="QBFT">
                {CONSENSUS_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="block-time">Block time (ms)</label>
              <input id="block-time" name="blockTimeMs" type="number" required min={250} max={120000} defaultValue={2000} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="version">Client version</label>
            <input id="version" name="version" required maxLength={40} placeholder="1.4.0" />
          </div>
          <div className="form-actions">
            <button className="btn" type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit proposal"}
            </button>
            <button className="btn-ghost" type="button" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {error && <InlineError message={error} />}
      {loading && <SkeletonRows />}

      {!loading && !error && chains && (
        chains.length === 0 ? (
          <div className="empty">No chains provisioned yet for this organization.</div>
        ) : (
          chains.map((chain) => (
            <div className="row" key={chain.id}>
              <div className="row-main">
                <b>{chain.name}</b>
                <span className="meta">
                  {chain.consensus} · {chain.networkType} · v{chain.version} · {chain.blockTimeMs}ms blocks
                </span>
              </div>
              <Badge status={chain.status} />
            </div>
          ))
        )
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Privacy (commitments)                                              */
/* ---------------------------------------------------------------- */

const VISIBILITY_OPTIONS = ["ORGANIZATION_PRIVATE", "COLLABORATION_SHARED", "USER_PRIVATE"];

export function PrivacySection({ orgId }: { orgId: string | null }) {
  const { data: chains } = useResource<Chain[]>(
    orgId ? `/api/v1/organizations/${orgId}/chains` : null,
    [orgId]
  );
  const [items, setItems] = useState<Commitment[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!orgId) return;

    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    setFormError("");

    try {
      const chainId = form.get("chainId");
      const created = await apiFetch<Commitment>(`/api/v1/organizations/${orgId}/commitments`, {
        method: "POST",
        body: JSON.stringify({
          privateData: form.get("privateData"),
          nonce: form.get("nonce"),
          visibility: form.get("visibility"),
          ...(chainId ? { chainId } : {}),
        }),
      });
      setItems((prev) => [created, ...prev]);
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "REQUEST_FAILED");
    } finally {
      setSubmitting(false);
    }
  }

  if (!orgId) return <NoOrgSelected />;

  return (
    <div className="split">
      <div className="card">
        <div className="card-head">
          <div>
            <h3>Commitments</h3>
            <p>Poseidon commitments created this session</p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="empty">
            No commitments created yet in this session. Use the form to submit
            private data and generate a commitment hash.
          </div>
        ) : (
          items.map((item) => (
            <div className="row" key={item.id}>
              <div className="row-main">
                <b className="mono">{truncateMiddle(item.commitment, 12, 8)}</b>
                <span className="meta">{item.scheme} · {formatRelativeTime(item.createdAt)}</span>
              </div>
              <span className={`badge ${item.visibility === "ORGANIZATION_PRIVATE" ? "info" : "neutral"}`}>
                {formatLabel(item.visibility)}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <LockIcon style={{ width: 15, height: 15, color: "var(--accent-strong)" }} />
              New commitment
            </h3>
            <p>Private data never leaves this form as plaintext to other tenants</p>
          </div>
        </div>

        <form className="stack" onSubmit={handleSubmit}>
          {formError && <InlineError message={formError} />}
          <div className="field">
            <label htmlFor="private-data">Private data</label>
            <textarea id="private-data" name="privateData" required rows={3} placeholder="Confidential payload" />
          </div>
          <div className="field">
            <label htmlFor="nonce">Nonce</label>
            <input id="nonce" name="nonce" required placeholder="Random per-commitment value" />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="visibility">Visibility</label>
              <select id="visibility" name="visibility" defaultValue="ORGANIZATION_PRIVATE">
                {VISIBILITY_OPTIONS.map((v) => (
                  <option key={v} value={v}>{formatLabel(v)}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="chain-select">Chain (optional)</label>
              <select id="chain-select" name="chainId" defaultValue="">
                <option value="">None</option>
                {(chains ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn" type="submit" disabled={submitting}>
              {submitting ? "Committing..." : "Create commitment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Collaboration                                                      */
/* ---------------------------------------------------------------- */

const PERMISSION_OPTIONS = [
  "READ_BLOCKS", "READ_COMMITMENTS", "CREATE_COMMITMENTS", "VERIFY_PROOFS",
  "SUBMIT_TRANSACTIONS", "DEPLOY_CONTRACTS", "READ_EVENTS",
];

export function CollaborationSection({ orgId, orgs }: { orgId: string | null; orgs: Organization[] }) {
  const [created, setCreated] = useState<Collaboration[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<string[]>(["READ_BLOCKS"]);
  const [blockViewId, setBlockViewId] = useState("");
  const [blockViewError, setBlockViewError] = useState("");
  const [blockViewLoading, setBlockViewLoading] = useState(false);
  const [blocks, setBlocks] = useState<unknown[] | null>(null);

  const partnerOrgs = useMemo(() => orgs.filter((o) => o.id !== orgId), [orgs, orgId]);

  function togglePerm(code: string) {
    setSelectedPerms((prev) => (prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code]));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!orgId) return;

    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    setFormError("");

    try {
      const collab = await apiFetch<Collaboration>("/api/v1/collaborations", {
        method: "POST",
        body: JSON.stringify({
          organizationAId: orgId,
          organizationBId: form.get("organizationBId"),
          permissions: selectedPerms,
        }),
      });
      setCreated((prev) => [collab, ...prev]);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "REQUEST_FAILED");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLoadBlocks(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!blockViewId) return;
    setBlockViewLoading(true);
    setBlockViewError("");

    try {
      const result = await apiFetch<unknown[]>(`/api/v1/collaborations/${blockViewId}/blocks`);
      setBlocks(result);
    } catch (err) {
      setBlockViewError(err instanceof ApiError ? err.message : "REQUEST_FAILED");
      setBlocks(null);
    } finally {
      setBlockViewLoading(false);
    }
  }

  if (!orgId) return <NoOrgSelected />;

  return (
    <div className="split">
      <div>
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Active collaborations</h3>
              <p>Created this session, from this organization</p>
            </div>
          </div>

          {created.length === 0 ? (
            <div className="empty">No collaborations proposed yet in this session.</div>
          ) : (
            created.map((c) => (
              <div className="row" key={c.id}>
                <div className="row-main">
                  <b className="mono">{truncateMiddle(c.id, 10, 6)}</b>
                  <span className="meta">with {c.organizationBId}</span>
                </div>
                <Badge status={c.status} />
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h3>View shared block feed</h3>
              <p>Fetch the visible block view for a collaboration ID</p>
            </div>
          </div>
          <form className="stack" onSubmit={handleLoadBlocks}>
            {blockViewError && <InlineError message={blockViewError} />}
            <div className="field-row">
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label htmlFor="collab-id">Collaboration ID</label>
                <input id="collab-id" value={blockViewId} onChange={(e) => setBlockViewId(e.target.value)} placeholder="clx..." />
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-ghost" type="submit" disabled={blockViewLoading || !blockViewId}>
                {blockViewLoading ? "Loading..." : "Load blocks"}
              </button>
            </div>
          </form>

          {blocks && (
            blocks.length === 0 ? (
              <div className="empty">No visible blocks recorded for this collaboration.</div>
            ) : (
              <div style={{ marginTop: 12 }}>
                {blocks.map((b, i) => (
                  <div className="row" key={i}>
                    <span className="mono meta">{JSON.stringify(b).slice(0, 80)}</span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h3>Propose collaboration</h3>
            <p>Share a scoped, permissioned view with another tenant</p>
          </div>
        </div>

        <form className="stack" onSubmit={handleSubmit}>
          {formError && <InlineError message={formError} />}
          <div className="field">
            <label htmlFor="partner-org">Partner organization</label>
            <select id="partner-org" name="organizationBId" required defaultValue="">
              <option value="" disabled>Select an organization</option>
              {partnerOrgs.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Shared permissions</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {PERMISSION_OPTIONS.map((code) => (
                <button
                  type="button"
                  key={code}
                  className="chip"
                  data-active={selectedPerms.includes(code)}
                  onClick={() => togglePerm(code)}
                >
                  {formatLabel(code)}
                </button>
              ))}
            </div>
          </div>
          <div className="form-actions">
            <button className="btn" type="submit" disabled={submitting || partnerOrgs.length === 0 || selectedPerms.length === 0}>
              {submitting ? "Proposing..." : "Propose collaboration"}
            </button>
          </div>
          {partnerOrgs.length === 0 && (
            <span className="meta">You need membership in at least two organizations to propose a collaboration.</span>
          )}
        </form>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Governance                                                         */
/* ---------------------------------------------------------------- */

export function GovernanceSection({ orgId, me }: { orgId: string | null; me: Me }) {
  const { data: proposals, loading, error, reload } = useResource<GovernanceProposal[]>(
    orgId ? `/api/v1/organizations/${orgId}/governance` : null,
    [orgId]
  );
  const [approving, setApproving] = useState<string | null>(null);
  const [rowError, setRowError] = useState<Record<string, string>>({});

  async function approve(proposalId: string) {
    setApproving(proposalId);
    setRowError((prev) => ({ ...prev, [proposalId]: "" }));

    try {
      await apiFetch(`/api/v1/governance/${proposalId}/approve`, { method: "POST" });
      reload();
    } catch (err) {
      setRowError((prev) => ({
        ...prev,
        [proposalId]: err instanceof ApiError ? err.message : "REQUEST_FAILED",
      }));
    } finally {
      setApproving(null);
    }
  }

  if (!orgId) return <NoOrgSelected />;

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h3>Governance proposals</h3>
          <p>Multi-party sign-off on chain, key, and permission changes</p>
        </div>
      </div>

      {error && <InlineError message={error} />}
      {loading && <SkeletonRows />}

      {!loading && !error && proposals && (
        proposals.length === 0 ? (
          <div className="empty">No governance proposals for this organization yet.</div>
        ) : (
          proposals.map((p) => {
            const approvedCount = p.approvals.filter((a) => a.approved).length;
            const pct = Math.min(100, Math.round((approvedCount / Math.max(1, p.requiredM)) * 100));
            const alreadyApproved = p.approvals.some((a) => a.approverId === me.id && a.approved);
            const pending = p.status.startsWith("PENDING") || p.status === "PROPOSED";

            return (
              <div className="row" key={p.id} style={{ alignItems: "flex-start" }}>
                <div className="row-main" style={{ flex: 1 }}>
                  <b>{formatLabel(p.type)}</b>
                  <span className="meta">{p.id} · {formatRelativeTime(p.createdAt)}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                    <div className="approval-bar" style={{ maxWidth: 160 }}>
                      <div className="approval-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="meta">{approvedCount}/{p.requiredM} of {p.requiredN}</span>
                  </div>
                  {rowError[p.id] && <span className="meta" style={{ color: "var(--red)" }}>{formatLabel(rowError[p.id])}</span>}
                </div>
                <div className="row-side" style={{ flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                  <Badge status={p.status} />
                  {pending && (
                    <button
                      className="btn-ghost btn-sm"
                      onClick={() => approve(p.id)}
                      disabled={approving === p.id || alreadyApproved}
                    >
                      {alreadyApproved ? "Approved" : approving === p.id ? "Approving..." : "Approve"}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Audit                                                              */
/* ---------------------------------------------------------------- */

export function AuditSection({ orgId }: { orgId: string | null }) {
  const { data: logs, loading, error } = useResource<AuditLogEntry[]>(
    orgId ? `/api/v1/organizations/${orgId}/audit-logs` : null,
    [orgId]
  );

  if (!orgId) return <NoOrgSelected />;

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h3>Audit trail</h3>
          <p>Recorded actions for this organization, most recent first</p>
        </div>
      </div>

      {error && <InlineError message={error} />}
      {loading && <SkeletonRows />}

      {!loading && !error && logs && (
        logs.length === 0 ? (
          <div className="empty">No audit events recorded yet for this organization.</div>
        ) : (
          logs.map((log) => (
            <div className="row" key={log.id}>
              <div className="row-main">
                <b>{formatLabel(log.action)}</b>
                <span className="meta">{log.resourceType}{log.resourceId ? ` · ${log.resourceId}` : ""} · {formatRelativeTime(log.createdAt)}</span>
              </div>
              <span className={`badge ${log.result === "SUCCESS" ? "ok" : "bad"}`}>{formatLabel(log.result)}</span>
            </div>
          ))
        )
      )}
    </div>
  );
}
