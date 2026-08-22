const API_BASE = "http://localhost:3000/api";

export const api = {
  async startRun(tenantId: string) {
    const res = await fetch(`${API_BASE}/runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId })
    });
    if (!res.ok) throw new Error("Failed to start run");
    return res.json();
  },

  async getRuns(tenantId: string) {
    const res = await fetch(`${API_BASE}/runs?tenantId=${tenantId}`);
    if (!res.ok) throw new Error("Failed to fetch runs");
    return res.json();
  },

  async getRunDetails(runId: string) {
    const res = await fetch(`${API_BASE}/runs/${runId}`);
    if (!res.ok) throw new Error("Failed to fetch run details");
    return res.json();
  },

  async getExceptions() {
    const res = await fetch(`${API_BASE}/exceptions`);
    if (!res.ok) throw new Error("Failed to fetch exceptions");
    return res.json();
  },

  async askAgent(tenantId: string, query: string) {
    const res = await fetch(`${API_BASE}/agent/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, query })
    });
    if (!res.ok) throw new Error("Failed to query agent");
    return res.json();
  }
};
