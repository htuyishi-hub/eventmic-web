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

  async uploadAvatar(imageBlobOrData, targetIdentity, code) {
    const headers = { ...this.getAuthHeaders() };
    const isBlob = typeof Blob !== 'undefined' && imageBlobOrData instanceof Blob;
    if (isBlob) {
      headers['Content-Type'] = imageBlobOrData.type || 'image/webp';
    } else {
      headers['Content-Type'] = 'application/json';
    }

    let url = `${this.apiBase}/avatar`;
    const params = new URLSearchParams();
    if (targetIdentity) params.append('identity', targetIdentity);
    if (code) params.append('code', code);
    const qs = params.toString();
    if (qs) url += `?${qs}`;

    const body = isBlob
      ? imageBlobOrData
      : JSON.stringify({ image: imageBlobOrData, targetIdentity, code });

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to upload avatar');
    return res.json();
  }

  async fetchAvatarBlob(code, identity) {
    const res = await fetch(`${this.apiBase}/avatar/${code}/${identity}`, {
      headers: this.getAuthHeaders()
    });
    if (res.status === 404 || res.status === 403) return null;
    if (!res.ok) throw new Error('Failed to fetch avatar');
    return res.blob();
  }

  async deleteAvatar(identity, code) {
    const headers = this.getAuthHeaders();
    let url = `${this.apiBase}/avatar`;
    if (identity) {
      url += `/${identity}`;
      if (code) url += `?code=${code}`;
    } else if (code) {
      url += `?code=${code}`;
    }
    const res = await fetch(url, { method: 'DELETE', headers });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to delete avatar');
    return res.json();
  }
}
