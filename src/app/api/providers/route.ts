import { NextRequest, NextResponse } from 'next/server';

// Type definition for Cloudflare D1 database
interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<D1Result>;
  all(): Promise<D1AllResult>;
  first(): Promise<unknown>;
}

interface D1Result {
  meta: {
    last_row_id: number;
    changes: number;
  };
}

interface D1AllResult {
  results: unknown[];
}

interface Env {
  DB?: D1Database;
}

interface PageProvider {
  id?: number;
  name: string;
  type: 'rorligt' | 'fastpris';
  logo_url: string;
  description: string;
  url: string;
  is_recommended: boolean;
  display_order: number;
  active: boolean;
  campaign_text?: string;
  campaign_bold?: boolean;
  campaign_italic?: boolean;
}

// GET - Fetch providers
export async function GET(request: NextRequest) {
  try {
    const db: D1Database | undefined = (process.env as unknown as Env)?.DB;
    
    if (!db) {
      return NextResponse.json({ 
        error: 'D1 database not configured',
        providers: []
      });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'rorligt' or 'fastpris'
    const activeOnly = searchParams.get('active') === 'true';

    let query = 'SELECT * FROM page_providers WHERE 1=1';
    const params: unknown[] = [];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    if (activeOnly) {
      query += ' AND active = 1';
    }

    query += ' ORDER BY display_order ASC';

    const result = await db.prepare(query).bind(...params).all();
    type D1ProviderRow = {
      id: number;
      name: string;
      type: string;
      logo_url: string;
      description: string;
      url: string;
      is_recommended: number;
      display_order: number;
      active: number;
      campaign_text?: string | null;
      campaign_bold?: number | null;
      campaign_italic?: number | null;
      created_at: number;
      updated_at: number;
    };
    const providers = ((result.results || []) as D1ProviderRow[]).map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      logo_url: row.logo_url,
      description: row.description,
      url: row.url,
      is_recommended: row.is_recommended === 1,
      display_order: row.display_order,
      active: row.active === 1,
      campaign_text: row.campaign_text || undefined,
      campaign_bold: row.campaign_bold === 1,
      campaign_italic: row.campaign_italic === 1,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    return NextResponse.json({ providers });
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      providers: []
    }, { status: 500 });
  }
}

// POST - Create new provider
export async function POST(request: NextRequest) {
  try {
    const db: D1Database | undefined = (process.env as unknown as Env)?.DB;
    
    if (!db) {
      return NextResponse.json({ 
        error: 'D1 database not configured'
      }, { status: 500 });
    }

    const body: PageProvider = await request.json();
    
    const result = await db.prepare(
      `INSERT INTO page_providers 
       (name, type, logo_url, description, url, is_recommended, display_order, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      body.name,
      body.type,
      body.logo_url,
      body.description,
      body.url,
      body.is_recommended ? 1 : 0,
      body.display_order,
      body.active ? 1 : 0,
      Math.floor(Date.now() / 1000),
      Math.floor(Date.now() / 1000)
    ).run();

    return NextResponse.json({ 
      id: result.meta.last_row_id,
      message: 'Provider created successfully'
    });
  } catch (error) {
    console.error('Error creating provider:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Update provider
export async function PUT(request: NextRequest) {
  try {
    const db: D1Database | undefined = (process.env as unknown as Env)?.DB;
    
    if (!db) {
      return NextResponse.json({ 
        error: 'D1 database not configured'
      }, { status: 500 });
    }

    const body: PageProvider = await request.json();
    
    if (!body.id) {
      return NextResponse.json({ 
        error: 'Provider ID is required'
      }, { status: 400 });
    }

    await db.prepare(
      `UPDATE page_providers 
       SET name = ?, type = ?, logo_url = ?, description = ?, url = ?, 
           is_recommended = ?, display_order = ?, active = ?, 
           campaign_text = ?, campaign_bold = ?, campaign_italic = ?, updated_at = ?
       WHERE id = ?`
    ).bind(
      body.name,
      body.type,
      body.logo_url,
      body.description,
      body.url,
      body.is_recommended ? 1 : 0,
      body.display_order,
      body.active ? 1 : 0,
      body.campaign_text || null,
      body.campaign_bold ? 1 : 0,
      body.campaign_italic ? 1 : 0,
      Math.floor(Date.now() / 1000),
      body.id
    ).run();

    return NextResponse.json({ 
      message: 'Provider updated successfully'
    });
  } catch (error) {
    console.error('Error updating provider:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Delete provider
export async function DELETE(request: NextRequest) {
  try {
    const db: D1Database | undefined = (process.env as unknown as Env)?.DB;
    
    if (!db) {
      return NextResponse.json({ 
        error: 'D1 database not configured'
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ 
        error: 'Provider ID is required'
      }, { status: 400 });
    }

    await db.prepare('DELETE FROM page_providers WHERE id = ?')
      .bind(parseInt(id))
      .run();

    return NextResponse.json({ 
      message: 'Provider deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting provider:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const runtime = 'edge';
