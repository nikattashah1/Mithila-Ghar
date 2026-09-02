export function formatNpr(value) {
  return `NPR ${Number(value || 0).toLocaleString('en-NP', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function sessionId() {
  let id = localStorage.getItem('mg_session');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('mg_session', id);
  }
  return id;
}
