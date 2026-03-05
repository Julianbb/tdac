import { NextResponse } from 'next/server';
import initSqlJs, { Database as SqlDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.resolve(process.cwd(), 'tdac.db');

function getTokenMap(): Record<string, string | null> {
  const raw = process.env.TDAC_TOKENS || '';
  const map: Record<string, string | null> = {};
  for (const pair of raw.split(',')) {
    const [token, agencyId] = pair.split('=');
    if (token) map[token.trim()] = agencyId?.trim() || null;
  }
  return map;
}

let cachedDb: SqlDatabase | null = null;
let dbMtime: number = 0;

async function getDb() {
  const stat = fs.statSync(DB_PATH);
  if (cachedDb && stat.mtimeMs === dbMtime) {
    return cachedDb;
  }
  if (cachedDb) cachedDb.close();
  const SQL = await initSqlJs({
    locateFile: (file: string) => path.join(process.cwd(), 'public', file),
  });
  cachedDb = new SQL.Database(fs.readFileSync(DB_PATH));
  dbMtime = stat.mtimeMs;
  return cachedDb;
}

export async function GET(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') || '';
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const offset = (page - 1) * pageSize;

    const tokenMap = getTokenMap();
    if (!(token in tokenMap)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agencyId = tokenMap[token];
    const isAdmin = agencyId === null;
    const db = await getDb();

    const whereClause = agencyId ? ' WHERE agency_id = ?' : '';
    const baseParams = agencyId ? [agencyId] : [];

    // Single query for total + finished count
    const countStmt = db.prepare(
      `SELECT COUNT(*) as total, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as finished FROM tdac${whereClause}`
    );
    if (baseParams.length) countStmt.bind(baseParams);
    countStmt.step();
    const counts = countStmt.getAsObject();
    const total = counts.total as number;
    const finishedCount = counts.finished as number;
    countStmt.free();

    const stmt = db.prepare(
      `SELECT * FROM tdac${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`
    );
    stmt.bind([...baseParams, pageSize, offset]);
    const rows: Record<string, unknown>[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();

    return NextResponse.json({
      data: rows,
      total,
      finishedCount,
      pendingCount: total - finishedCount,
      page,
      pageSize,
      isAdmin,
    });
  } catch {
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
