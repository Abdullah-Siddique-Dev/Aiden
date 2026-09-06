export function authHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function searchUsers(query, token) {
  if (!query || !query.trim()) return [];
  const res = await fetch(`/api/users/search?q=${encodeURIComponent(query.trim())}`, {
    headers: authHeader(token),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.users || [];
}
