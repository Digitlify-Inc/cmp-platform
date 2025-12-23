"use client";

import { useState } from "react";

interface APIKey {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
  last_used_at?: string;
}

interface APIKeysListProps {
  instanceId: string;
  channel: string;
  initialKeys: APIKey[];
}

export function APIKeysList({ instanceId, channel, initialKeys }: APIKeysListProps) {
  const [keys, setKeys] = useState<APIKey[]>(initialKeys);
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createKey = async () => {
    if (!newKeyName.trim()) {
      setError("Please enter a name for the API key");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/instances/${instanceId}/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      });

      if (!response.ok) {
        throw new Error("Failed to create API key");
      }

      const data = await response.json() as APIKey & { key: string };
      setNewKeyValue(data.key);
      setKeys([...keys, data]);
      setNewKeyName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create API key");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) {
      return;
    }

    try {
      const response = await fetch(`/api/instances/${instanceId}/api-keys/${keyId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete API key");
      }

      setKeys(keys.filter((k) => k.id !== keyId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete API key");
    }
  };

  return (
    <div>
      {/* Create Key Form */}
      <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-medium text-gray-900">Create New API Key</h3>
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        {isCreating ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="keyName" className="block text-sm font-medium text-gray-700">
                Key Name
              </label>
              <input
                type="text"
                id="keyName"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g., Production API Key"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={createKey}
                disabled={isLoading}
                className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {isLoading ? "Creating..." : "Create Key"}
              </button>
              <button
                onClick={() => { setIsCreating(false); setNewKeyName(""); setError(null); }}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            Create New API Key
          </button>
        )}
      </div>

      {/* Keys List */}
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900">Your API Keys</h3>
        </div>
        {keys.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-gray-500">No API keys yet. Create your first key to get started.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {keys.map((key) => (
              <li key={key.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <span className="font-medium text-gray-900">{key.name}</span>
                  <span className="ml-2 font-mono text-sm text-gray-500">{key.prefix}...</span>
                  <div className="text-sm text-gray-500">
                    Created {new Date(key.created_at).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => deleteKey(key.id)}
                  className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
