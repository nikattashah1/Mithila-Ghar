const { getDb } = require('../config/db');

function normalizeRow(row) {
  if (!row || typeof row !== 'object') return row;
  const clone = { ...row };
  clone._id = clone._id ?? clone.id ?? null;
  clone.id = clone.id ?? clone._id ?? null;
  if (clone.password_hash !== undefined && clone.passwordHash === undefined) {
    clone.passwordHash = clone.password_hash;
  }
  if (clone.passwordHash !== undefined && clone.password_hash === undefined) {
    clone.password_hash = clone.passwordHash;
  }
  return clone;
}

class SqliteQuery {
  constructor(model, method, where = {}, options = {}) {
    this.model = model;
    this.method = method;
    this.where = where;
    this.options = options;
    this.projection = null;
    this.sortValue = null;
    this.populateValue = null;
    this._cachedResult = null;
  }

  select(fields) {
    this.projection = fields;
    return this;
  }

  sort(field) {
    this.sortValue = field;
    return this;
  }

  populate() {
    return this;
  }

  lean() {
    return this;
  }

  applyProjection(row) {
    if (!row || !this.projection) return row;
    const projection = this.projection;
    if (typeof projection === 'string') {
      const next = {};
      const fields = projection.split(' ').filter(Boolean);
      for (const field of fields) {
        const cleaned = field.replace(/^[+\-]/, '');
        if (cleaned && cleaned in row) next[cleaned] = row[cleaned];
      }
      if (projection.includes('+passwordHash') && row.password_hash !== undefined) {
        next.passwordHash = row.password_hash;
      }
      return Object.keys(next).length ? next : row;
    }
    if (Array.isArray(projection)) {
      const next = {};
      for (const field of projection) {
        if (field in row) next[field] = row[field];
      }
      return next;
    }
    return row;
  }

  async execute() {
    const db = await getDb();
    const entries = Object.entries(this.where || {});
    const clauses = [];
    const params = [];

    for (const [key, value] of entries) {
      const column = key.replace(/\./g, '_');
      const hasIn = value && typeof value === 'object' && !Array.isArray(value) && '$in' in value;
      const hasNe = value && typeof value === 'object' && !Array.isArray(value) && '$ne' in value;

      if (hasIn) {
        clauses.push(`${column} IN (${value.$in.map(() => '?').join(',')})`);
        params.push(...value.$in);
      } else if (hasNe) {
        clauses.push(`${column} != ?`);
        params.push(value.$ne);
      } else {
        clauses.push(`${column} = ?`);
        params.push(value);
      }
    }

    let sql = `SELECT * FROM ${this.model.table}`;
    if (clauses.length) sql += ` WHERE ${clauses.join(' AND ')}`;
    if (this.sortValue) {
      const field = String(this.sortValue).replace(/^-/, '');
      const direction = String(this.sortValue).startsWith('-') ? 'DESC' : 'ASC';
      sql += ` ORDER BY ${field.replace(/\./g, '_')} ${direction}`;
    } else {
      sql += ' ORDER BY id DESC';
    }

    if (this.method === 'one') {
      const row = await db.get(sql, params);
      const normalized = normalizeRow(row);
      this._cachedResult = this.applyProjection(normalized);
      return this._cachedResult;
    }

    const rows = await db.all(sql, params);
    this._cachedResult = rows.map((row) => this.applyProjection(normalizeRow(row)));
    return this._cachedResult;
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }

  catch(reject) {
    return this.execute().catch(reject);
  }
}

class SqliteModel {
  constructor(table) {
    this.table = table;
  }

  findOne(where = {}) {
    return new SqliteQuery(this, 'one', where);
  }

  find(where = {}) {
    return new SqliteQuery(this, 'many', where);
  }

  countDocuments(where = {}) {
    return this._countDocuments(where);
  }

  async _countDocuments(where = {}) {
    const db = await getDb();
    const entries = Object.entries(where || {});
    const clauses = [];
    const params = [];

    for (const [key, value] of entries) {
      const column = key.replace(/\./g, '_');
      const hasIn = value && typeof value === 'object' && !Array.isArray(value) && '$in' in value;
      if (hasIn) {
        clauses.push(`${column} IN (${value.$in.map(() => '?').join(',')})`);
        params.push(...value.$in);
      } else {
        clauses.push(`${column} = ?`);
        params.push(value);
      }
    }

    let sql = `SELECT COUNT(*) as count FROM ${this.table}`;
    if (clauses.length) sql += ` WHERE ${clauses.join(' AND ')}`;
    const row = await db.get(sql, params);
    return Number(row?.count || 0);
  }

  async create(data = {}) {
    const db = await getDb();
    const keys = Object.keys(data || {});
    if (!keys.length) return null;
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map((key) => data[key]);
    const sql = `INSERT INTO ${this.table} (${keys.join(', ')}) VALUES (${placeholders})`;
    const result = await db.run(sql, values);
    const row = await db.get(`SELECT * FROM ${this.table} WHERE id = ?`, [result.lastID]);
    return normalizeRow(row);
  }

  async findById(id) {
    const db = await getDb();
    const row = await db.get(`SELECT * FROM ${this.table} WHERE id = ?`, [id]);
    return row ? normalizeRow(row) : null;
  }

  async findByIdAndUpdate(id, data, options = {}) {
    const db = await getDb();
    const current = await db.get(`SELECT * FROM ${this.table} WHERE id = ?`, [id]);
    if (!current) return null;
    const fields = Object.keys(data || {});
    const assignments = fields.map((key) => `${key} = ?`).join(', ');
    const values = fields.map((key) => data[key]);
    await db.run(`UPDATE ${this.table} SET ${assignments} WHERE id = ?`, [...values, id]);
    const row = await db.get(`SELECT * FROM ${this.table} WHERE id = ?`, [id]);
    return normalizeRow(row);
  }

  async findByIdAndDelete(id) {
    const db = await getDb();
    const current = await db.get(`SELECT * FROM ${this.table} WHERE id = ?`, [id]);
    if (!current) return null;
    await db.run(`DELETE FROM ${this.table} WHERE id = ?`, [id]);
    return normalizeRow(current);
  }

  async deleteOne(where = {}) {
    const db = await getDb();
    const row = await this.findOne(where).execute();
    if (!row) return null;
    await db.run(`DELETE FROM ${this.table} WHERE id = ?`, [row.id]);
    return row;
  }
}

module.exports = SqliteModel;
