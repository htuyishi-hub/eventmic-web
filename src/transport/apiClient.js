/**
 * REST API client helper for session and principal CRUD.
 */

export class ApiClient {
  constructor(apiBase, getAuthHeaders) {
    this.apiBase = apiBase;
    this.getAuthHeaders = getAuthHeaders;
  }

  async createSession(name, passcode) {
    const res = await fetch(`${this.apiBase}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-host-passcode': passcode },
      body: JSON.stringify({ name })
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to create session');
    return res.json();
  }

  async endSession(code) {
    await fetch(`${this.apiBase}/sessions/${code}/end`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    }).catch(() => {});
  }

  async postFloorAction(endpoint, body) {
    const res = await fetch(`${this.apiBase}/floor/${endpoint}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Failed on ${endpoint}`);
    return res.json().catch(() => ({}));
  }

  async managePrincipal(code, action, id, name) {
    const headers = this.getAuthHeaders();
    if (action === 'create') {
      const res = await fetch(`${this.apiBase}/sessions/${code}/principals`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name })
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to create principal');
      return res.json();
    }
    if (action === 'list') {
      const res = await fetch(`${this.apiBase}/sessions/${code}/principals`, { headers });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to list principals');
      return res.json();
    }
    if (action === 'revoke') {
      const res = await fetch(`${this.apiBase}/sessions/${code}/principals/${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to revoke principal');
      return res.json();
    }
    if (action === 'regenerate') {
      const res = await fetch(`${this.apiBase}/sessions/${code}/principals/${id}/regenerate`, { method: 'POST', headers });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to regenerate PIN');
      return (await res.json()).pin;
    }
  }

  async fetchState(code) {
    const res = await fetch(`${this.apiBase}/sessions/${code}/state`, { headers: this.getAuthHeaders() });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to fetch session state');
    return res.json();
  }

  async updateSettings(code, settings) {
    const res = await fetch(`${this.apiBase}/sessions/${code}/settings`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to update settings');
    return res.json();
  }
}
