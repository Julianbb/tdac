import { NextResponse } from 'next/server';
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_PATH = '/Users/julian/.openclaw/workspace-dongge/database/tdac.db';

const TOKEN_MAP: Record<string, string | null> = {
  liao123: '廖',
  lyly123: 'lyly',
  chen123: '陈小姐',
  admin888: null, // null = see all
};

async function getDb() {
  const SQL = await initSqlJs({
    locateFile: (file: string) => path.join(process.cwd(), 'public', file),
  });
  const fileBuffer = fs.readFileSync(DB_PATH);
  return new SQL.Database(fileBuffer);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const offset = (page - 1) * pageSize;

    if (!(token in TOKEN_MAP)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agencyFilter = TOKEN_MAP[token];
    const isAdmin = agencyFilter === null;
    const db = await getDb();

    const whereClause = agencyFilter ? ' WHERE agency = ?' : '';
    const bindParams = agencyFilter ? [agencyFilter] : [];

    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM tdac${whereClause}`);
    if (agencyFilter) countStmt.bind([agencyFilter]);
    countStmt.step();
    const total = countStmt.getAsObject().count as number;
    countStmt.free();

    const finishedStmt = db.prepare(`SELECT COUNT(*) as count FROM tdac${whereClause ? whereClause + ' AND' : ' WHERE'} is_finished = 1`);
    if (agencyFilter) finishedStmt.bind([agencyFilter]);
    finishedStmt.step();
    const finishedCount = finishedStmt.getAsObject().count as number;
    finishedStmt.free();

    const pendingStmt = db.prepare(`SELECT COUNT(*) as count FROM tdac${whereClause ? whereClause + ' AND' : ' WHERE'} is_finished = 0`);
    if (agencyFilter) pendingStmt.bind([agencyFilter]);
    pendingStmt.step();
    const pendingCount = pendingStmt.getAsObject().count as number;
    pendingStmt.free();

    const stmt = db.prepare(`SELECT * FROM tdac${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`);
    stmt.bind(agencyFilter ? [agencyFilter, pageSize, offset] : [pageSize, offset]);
    const rows: any[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    db.close();

    return NextResponse.json({
      data: rows,
      total,
      finishedCount,
      pendingCount,
      page,
      pageSize,
      isAdmin,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
