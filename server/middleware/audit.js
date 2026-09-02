const AuditLog = require('../models/AuditLog');
async function writeAudit({ action, user, email, ip, success = true, metadata = {} }) {
  try {
    await AuditLog.create({ action, user: user || null, email: email || '', ip: ip || '', success, metadata });
  } catch (error) {
    console.error('Audit log failed:', error.message);
  }
}
module.exports = { writeAudit, writeAudit };
