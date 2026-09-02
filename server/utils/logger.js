function logInfo(message, extra = {}) {
  const safe = { ...extra };
  delete safe.password;
  delete safe.passwordHash;
  delete safe.cardNumber;
  delete safe.cvv;
  delete safe.secret;
  console.log(`[mithila-ghar] ${message}`, Object.keys(safe).length ? safe : '');
}

module.exports = { logInfo };
