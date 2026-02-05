const KEY = "prjx_access_token";

export function getAccessToken() {
  return localStorage.getItem(KEY);
}

export function setAccessToken(token) {
  localStorage.setItem(KEY, token);
}

export function clearAccessToken() {
  localStorage.removeItem(KEY);
}
