import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Note: Playwright requires Node.js runtime, but Cloudflare Pages requires Edge Runtime
// This will cause runtime errors. Consider using a separate Node.js server for automation.
// Set to 'edge' to allow Cloudflare Pages build, but Playwright will NOT work
// Updated: 2026-02-03 - All Playwright code removed for Edge Runtime compatibility
export const runtime = 'edge';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// CHEAP_ENERGY_URL is not used in Edge Runtime (Playwright not available)
// const CHEAP_ENERGY_URL = 'https://www.cheapenergy.se/teckna-elavtal/?src=Elchef';

// Helper function to log step to Supabase
async function logStep(
  sessionId: string,
  step: string,
  stepData: Record<string, unknown>,
  status: 'in_progress' | 'completed' | 'failed' = 'in_progress',
  error?: string,
  signingUrl?: string
) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.log(`[Automation Log] ${step}:`, stepData, status);
    return;
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    await supabase.from('cheap_energy_automation_logs').insert({
      session_id: sessionId,
      step,
      step_data: stepData,
      status,
      error_message: error,
      signing_url: signingUrl,
    });
  } catch (error) {
    console.error('Error logging step:', error);
  }
}

// Helper function to run automation steps in sequence
// Note: steps parameter removed as it's not used in Edge Runtime (Playwright not available)
async function runAutomationSteps(sessionId: string) {
  // Since we're using Edge Runtime, Playwright will not work
  // Return a clear error message immediately
  await logStep(sessionId, 'runtime_check_failed', {}, 'failed', 'Edge Runtime detected - Playwright requires Node.js runtime');
  throw new Error('Browser automation är inte tillgängligt i Edge Runtime. Denna funktion kräver Node.js runtime och fungerar endast lokalt eller på plattformar som Vercel, Railway, eller Render. För att testa lokalt, kör "npm run dev" och testa via localhost:3000.');
}

export async function POST(req: NextRequest) {
  try {
    // Check if we're in Edge Runtime (Cloudflare Pages, etc.)
    // Edge Runtime doesn't support Playwright, so return error immediately
    // Use a check that works in Edge Runtime (checking for globalThis instead of process)
    const isEdgeRuntime = typeof globalThis !== 'undefined' && 
      (globalThis.constructor?.name === 'DedicatedWorkerGlobalScope' || 
       globalThis.constructor?.name === 'ServiceWorkerGlobalScope' ||
       typeof EdgeRuntime !== 'undefined');
    
    if (isEdgeRuntime) {
      return NextResponse.json({ 
        error: 'Browser automation är inte tillgängligt i Edge Runtime',
        message: 'Denna funktion kräver Node.js runtime och fungerar endast lokalt eller på plattformar som Vercel, Railway, eller Render. För att testa lokalt, kör "npm run dev" och testa via localhost:3000.',
        details: 'Playwright kräver Node.js runtime som inte är tillgängligt i Edge Runtime (Cloudflare Pages).'
      }, { status: 503 }); // 503 Service Unavailable
    }

    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json({ 
        error: 'Ogiltig JSON i request body',
        details: parseError instanceof Error ? parseError.message : String(parseError)
      }, { status: 400 });
    }

    const { 
      sessionId, 
      action, 
      // data is not used in Edge Runtime (Playwright not available)
      steps // For running multiple steps in sequence
    } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId saknas' }, { status: 400 });
    }

    // Run multiple steps in sequence (preferred method)
    if (steps && Array.isArray(steps)) {
      try {
        const results = await runAutomationSteps(sessionId);
        return NextResponse.json({ 
          success: true, 
          results 
        });
      } catch (error) {
        console.error('Error in runAutomationSteps:', error);
        const errorMsg = error instanceof Error ? error.message : 'Okänt fel';
        await logStep(sessionId, 'automation_failed', { error: errorMsg }, 'failed', errorMsg);
        return NextResponse.json({ 
          error: errorMsg,
          details: error instanceof Error ? error.stack : String(error)
        }, { status: 500 });
      }
    }

    // Single step execution (for backward compatibility)
    if (action === 'start') {
      return NextResponse.json({ 
        success: true, 
        message: 'Använd "steps" array för att köra automation' 
      });
    }

    // Fill postnummer
    if (action === 'fill_postnummer') {
      return NextResponse.json({ 
        error: 'Browser automation är inte tillgängligt i Edge Runtime',
        message: 'Denna funktion kräver Node.js runtime och fungerar endast lokalt eller på plattformar som Vercel, Railway, eller Render.'
      }, { status: 503 });
    }

    // Fill forbrukning
    if (action === 'fill_forbrukning') {
      return NextResponse.json({ 
        error: 'Browser automation är inte tillgängligt i Edge Runtime',
        message: 'Denna funktion kräver Node.js runtime och fungerar endast lokalt eller på plattformar som Vercel, Railway, eller Render.'
      }, { status: 503 });
    }

    // Select contract type (rörligt timpris)
    if (action === 'select_contract_type') {
      return NextResponse.json({ 
        error: 'Browser automation är inte tillgängligt i Edge Runtime',
        message: 'Denna funktion kräver Node.js runtime och fungerar endast lokalt eller på plattformar som Vercel, Railway, eller Render.'
      }, { status: 503 });
    }

    // Fill personnummer and get address
    if (action === 'fill_personnummer') {
      return NextResponse.json({ 
        error: 'Browser automation är inte tillgängligt i Edge Runtime',
        message: 'Denna funktion kräver Node.js runtime och fungerar endast lokalt eller på plattformar som Vercel, Railway, eller Render.'
      }, { status: 503 });
    }

    // Handle address confirmation
    if (action === 'confirm_address') {
      return NextResponse.json({ 
        error: 'Browser automation är inte tillgängligt i Edge Runtime',
        message: 'Denna funktion kräver Node.js runtime och fungerar endast lokalt eller på plattformar som Vercel, Railway, eller Render.'
      }, { status: 503 });
    }

    // Fill contact details
    if (action === 'fill_contact_details') {
      return NextResponse.json({ 
        error: 'Browser automation är inte tillgängligt i Edge Runtime',
        message: 'Denna funktion kräver Node.js runtime och fungerar endast lokalt eller på plattformar som Vercel, Railway, eller Render.'
      }, { status: 503 });
    }

    // Submit form and get signing URL
    if (action === 'submit_form') {
      return NextResponse.json({ 
        error: 'Browser automation är inte tillgängligt i Edge Runtime',
        message: 'Denna funktion kräver Node.js runtime och fungerar endast lokalt eller på plattformar som Vercel, Railway, eller Render.'
      }, { status: 503 });
    }

    return NextResponse.json({ error: 'Okänd action' }, { status: 400 });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Okänt fel';
    const errorStack = error instanceof Error ? error.stack : String(error);
    console.error('Automation error:', error);
    console.error('Error stack:', errorStack);
    return NextResponse.json({ 
      error: errorMsg,
      details: errorStack,
      type: error instanceof Error ? error.constructor.name : typeof error
    }, { status: 500 });
  }
}

// WARNING: Playwright requires Node.js runtime, but Cloudflare Pages requires Edge Runtime
// This route will NOT work on Cloudflare Pages. Consider:
// 1. Running automation on a separate Node.js server (Vercel, Railway, etc.)
// 2. Using a browser automation service (Browserless, ScrapingBee, etc.)
// 3. Using Puppeteer with Chrome for Testing in Edge Runtime (limited support)
