const REAP_NODE_API = '/agentsapi'; // Using the proxy

class ReapNodeService {
  async get(key: string) {
    const response = await fetch(`${REAP_NODE_API}/storage/${key}`);
    if (!response.ok) {
      throw new Error(`Failed to get data for key: ${key}`);
    }
    return response.json();
  }

  async put(key: string, value: any) {
    const response = await fetch(`${REAP_NODE_API}/storage`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key, value }),
    });
    if (!response.ok) {
      throw new Error(`Failed to put data for key: ${key}`);
    }
    return response.json();
  }

  async delete(key: string) {
    const response = await fetch(`${REAP_NODE_API}/storage/${key}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete data for key: ${key}`);
    }
    return response.json();
  }

  async announce(capabilities: any) {
    const response = await fetch(`${REAP_NODE_API}/cis/announce`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(capabilities),
    });
    if (!response.ok) {
      throw new Error('Failed to announce capabilities');
    }
    return response.json();
  }
}

export const reapNodeService = new ReapNodeService();
