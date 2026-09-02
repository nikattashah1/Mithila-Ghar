const env = require('../config/env');
function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
}
function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;
  if (env.nodeEnv !== 'test') console.error('[error]', err.message);
  res.status(status).json({ message: err.message || 'Server error.' });
}
module.exports = { notFound, errorHandler };
