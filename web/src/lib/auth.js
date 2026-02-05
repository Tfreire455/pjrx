export function setAccessToken(token) {
  localStorage.setItem("prjx_access_token", token);
}

export function getAccessToken() {
  return localStorage.getItem("prjx_access_token");
}

export function clearAccessToken() {
  localStorage.removeItem("prjx_access_token");
}
