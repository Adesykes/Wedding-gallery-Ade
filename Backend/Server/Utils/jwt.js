import jwt from 'jwt-decode';

export function getOrCreateGuestToken() {
  const tokenKey = 'guest_token';
  const token = localStorage.getItem(tokenKey);

  if (token) {
    try {
      const decoded = jwt(token);
      if (decoded.exp * 1000 > Date.now()) return token;
    } catch (e) {}
  }

  const newToken = generateGuestToken();
  localStorage.setItem(tokenKey, newToken);
  return newToken;
}

function generateGuestToken() {
  // Fake JWT for demo (you’ll replace with signed tokens from backend later)
  const payload = {
    guest: true,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
  };
  return btoa(JSON.stringify(payload));
}
