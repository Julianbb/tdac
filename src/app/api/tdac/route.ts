import { NextResponse } from 'next/server';
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_PATH = '/Users/julian/Desktop/service/tdac/tdac.db';

// token → agency_id (null = admin, see all)
const TOKEN_MAP: Record<string, string | null> = {
  liao123:   '8441022310',  // 廖XX
  lyly123:   '8530786872',  // Lyly
  chen123:   '7381539700',  // CHEN ROSE
  monica123: '7967863736',  // 张XX / Monica
  admin888:  null,          // admin, see all
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

    const agencyId = TOKEN_MAP[token];
    const isAdmin = agencyId === null;
    const db = await getDb();

    const whereClause = agencyId ? ' WHERE agency_id = ?' : '';

    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM tdac${whereClause}`);
    if (agencyId) countStmt.bind([agencyId]);
    countStmt.step();
    const total = countStmt.getAsObject().count as number;
    countStmt.free();

    const finishedStmt = db.prepare(
      `SELECT COUNT(*) as count FROM tdac${whereClause ? whereClause + ' AND' : ' WHERE'} status = 'completed'`
    );
    if (agencyId) finishedStmt.bind([agencyId]);
    finishedStmt.step();
    const finishedCount = finishedStmt.getAsObject().count as number;
    finishedStmt.free();

    const pendingStmt = db.prepare(
      `SELECT COUNT(*) as count FROM tdac${whereClause ? whereClause + ' AND' : ' WHERE'} status != 'completed'`
    );
    if (agencyId) pendingStmt.bind([agencyId]);
    pendingStmt.step();
    const pendingCount = pendingStmt.getAsObject().count as number;
    pendingStmt.free();

    const stmt = db.prepare(
      `SELECT * FROM tdac${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`
    );
    stmt.bind(agencyId ? [agencyId, pageSize, offset] : [pageSize, offset]);
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
