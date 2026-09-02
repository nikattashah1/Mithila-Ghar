const crypto = require('crypto');

function getOrCreateSessionId(req, res) {
  let sessionId = req.cookies?.mg_sid;
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    res.cookie('mg_sid', sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 30
    });
  }
  return sessionId;
}

module.exports = { getOrCreateSessionId, getOrCreateSessionId: getOrCreateSessionId };
