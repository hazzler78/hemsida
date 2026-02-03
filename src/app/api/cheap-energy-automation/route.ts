import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Note: Playwright requires Node.js runtime, but Cloudflare Pages requires Edge Runtime
// This will cause runtime errors. Consider using a separate Node.js server for automation.
// Set to 'edge' to allow Cloudflare Pages build, but Playwright will NOT work
export const runtime = 'edge';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CHEAP_ENERGY_URL = 'https://www.cheapenergy.se/teckna-elavtal/?src=Elchef';

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
async function runAutomationSteps(
  sessionId: string,
  steps: Array<{ action: string; data: Record<string, unknown> }>
) {
  // Since we're using Edge Runtime, Playwright will not work
  // Return a clear error message immediately
  await logStep(sessionId, 'runtime_check_failed', {}, 'failed', 'Edge Runtime detected - Playwright requires Node.js runtime');
  throw new Error('Browser automation är inte tillgängligt i Edge Runtime. Denna funktion kräver Node.js runtime och fungerar endast lokalt eller på plattformar som Vercel, Railway, eller Render. För att testa lokalt, kör "npm run dev" och testa via localhost:3000.');
  
  // The code below will never execute in Edge Runtime, but we keep it for reference
  // when running on Node.js platforms
  /*
  // Dynamic import of Playwright (only works in Node.js runtime)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let chromium: any;
  try {
    const playwright = await import('playwright');
    chromium = playwright.chromium;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Okänt fel';
    await logStep(sessionId, 'playwright_import_failed', {}, 'failed', `Playwright import failed: ${errorMsg}`);
    throw new Error('Playwright kunde inte importeras. Browser automation kräver Node.js runtime.');
  }
  */

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  try {
    // Navigate to Cheap Energy form
    await page.goto(CHEAP_ENERGY_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await logStep(sessionId, 'page_loaded', { url: CHEAP_ENERGY_URL }, 'completed');
    
    // Wait for initial load (5 seconds as mentioned)
    await page.waitForTimeout(5000);

    const results: Record<string, unknown> = {};

    // Execute each step in sequence
    for (const step of steps) {
      const { action, data } = step;
      
      try {
        if (action === 'fill_postnummer') {
          const postnummerSelector = 'input[name="postnummer"], input[placeholder*="postnummer" i], input[type="text"][id*="post" i], input[name="zip"], input[name="postal"]';
          await page.waitForSelector(postnummerSelector, { timeout: 10000 });
          await page.fill(postnummerSelector, data.postnummer as string);
          await page.keyboard.press('Tab');
          await page.waitForTimeout(2000);
          await logStep(sessionId, 'postnummer_filled', { postnummer: data.postnummer }, 'completed');
          results.postnummer = 'completed';
        }

        else if (action === 'fill_forbrukning') {
          // Try multiple selector strategies
          const forbrukningSelectors = [
            `button:has-text("${data.forbrukning}")`,
            `[role="button"]:has-text("${data.forbrukning}")`,
            `button:has-text("${data.forbrukning} kWh")`,
            `input[value="${data.forbrukning}"]`,
          ];
          
          let found = false;
          for (const selector of forbrukningSelectors) {
            try {
              await page.waitForSelector(selector, { timeout: 3000 });
              await page.click(selector);
              found = true;
              break;
            } catch {}
          }
          
          if (!found) {
            // Try input field instead
            const inputSelector = 'input[name="forbrukning"], input[name="usage"], input[type="number"]';
            const input = await page.$(inputSelector);
            if (input) {
              await page.fill(inputSelector, data.forbrukning as string);
            }
          }
          
          await page.waitForTimeout(1000);
          await logStep(sessionId, 'forbrukning_selected', { forbrukning: data.forbrukning }, 'completed');
          results.forbrukning = 'completed';
        }

        else if (action === 'select_contract_type') {
          const contractSelectors = [
            'button:has-text("Rörligt timpris")',
            'button:has-text("Rörligt")',
            '[role="button"]:has-text("Rörligt timpris")',
            'input[value="rorligt"]',
            'input[value="variable"]',
          ];
          
          for (const selector of contractSelectors) {
            try {
              await page.waitForSelector(selector, { timeout: 3000 });
              await page.click(selector);
              break;
            } catch {}
          }
          
          await page.waitForTimeout(1000);
          await logStep(sessionId, 'contract_type_selected', { type: 'rorligt_timpris' }, 'completed');
          results.contractType = 'completed';
        }

        else if (action === 'fill_personnummer') {
          const personnummerSelector = 'input[name="personnummer"], input[name="ssn"], input[placeholder*="personnummer" i], input[type="text"][id*="person" i]';
          await page.waitForSelector(personnummerSelector, { timeout: 10000 });
          await page.fill(personnummerSelector, data.personnummer as string);
          await page.keyboard.press('Tab');
          await page.waitForTimeout(3000);

          // Extract filled address data
          const addressData: Record<string, string> = {};
          const selectors = {
            fornamn: 'input[name="fornamn"], input[name="firstName"], input[placeholder*="förnamn" i]',
            efternamn: 'input[name="efternamn"], input[name="lastName"], input[placeholder*="efternamn" i]',
            adress: 'input[name="adress"], input[name="address"], input[placeholder*="adress" i]',
            ort: 'input[name="ort"], input[name="city"], input[placeholder*="ort" i]',
          };

          for (const [key, selector] of Object.entries(selectors)) {
            try {
              addressData[key] = await page.inputValue(selector);
            } catch {}
          }

          await logStep(sessionId, 'personnummer_filled', { personnummer: data.personnummer, ...addressData }, 'completed');
          results.personnummer = 'completed';
          results.addressData = addressData;
        }

        else if (action === 'confirm_address') {
          const buttonText = data.confirmed 
            ? 'Ja, jag står på nuvarande elavtal på adressen'
            : 'Nej, jag står inte på nuvarande elavtal på adressen';
          
          const buttonSelectors = [
            `button:has-text("${buttonText}")`,
            `[role="button"]:has-text("${buttonText.substring(0, 20)}")`,
            data.confirmed ? 'button:has-text("Ja")' : 'button:has-text("Nej")',
            `input[value="${data.confirmed ? 'yes' : 'no'}"]`,
          ];
          
          for (const selector of buttonSelectors) {
            try {
              await page.waitForSelector(selector, { timeout: 3000 });
              await page.click(selector);
              break;
            } catch {}
          }
          
          await page.waitForTimeout(1000);
          await logStep(sessionId, 'address_confirmed', { confirmed: data.confirmed }, 'completed');
          results.addressConfirmation = 'completed';
        }

        else if (action === 'fill_contact_details') {
          // Fill email
          if (data.email) {
            const emailSelector = 'input[type="email"], input[name="email"], input[placeholder*="e-post" i]';
            try {
              await page.waitForSelector(emailSelector, { timeout: 5000 });
              await page.fill(emailSelector, data.email as string);
            } catch {}
          }

          // Fill telefon
          if (data.telefon) {
            const telefonSelector = 'input[type="tel"], input[name="telefon"], input[name="phone"], input[placeholder*="telefon" i]';
            try {
              await page.waitForSelector(telefonSelector, { timeout: 5000 });
              await page.fill(telefonSelector, data.telefon as string);
            } catch {}
          }

          // Fill tillträdesdatum
          if (data.tilltradesdatum) {
            const datumSelector = 'input[type="date"], input[name="tilltradesdatum"], input[name="startDate"], input[placeholder*="datum" i]';
            try {
              await page.waitForSelector(datumSelector, { timeout: 5000 });
              await page.fill(datumSelector, data.tilltradesdatum as string);
            } catch {}
          }

          // Fill anläggnings-ID (optional)
          if (data.anlagningsId) {
            const anlaggningSelector = 'input[name*="anläggning" i], input[name*="anlaggning" i], input[name="facilityId"], input[placeholder*="anläggning" i]';
            try {
              await page.waitForSelector(anlaggningSelector, { timeout: 3000 });
              await page.fill(anlaggningSelector, data.anlagningsId as string);
            } catch {}
          }

          // Select betalsätt
          if (data.betalsatt) {
            const betalsattMap: Record<string, string> = {
              'autogiro': 'Autogiro',
              'kort': 'Kort',
              'faktura': 'Faktura',
            };
            const betalsattText = betalsattMap[data.betalsatt as string] || (data.betalsatt as string);
            const betalsattSelectors = [
              `button:has-text("${betalsattText}")`,
              `[role="button"]:has-text("${betalsattText}")`,
              `input[value="${data.betalsatt as string}"]`,
            ];
            
            for (const selector of betalsattSelectors) {
              try {
                await page.waitForSelector(selector, { timeout: 3000 });
                await page.click(selector);
                break;
              } catch {}
            }
          }

          await page.waitForTimeout(1000);
          await logStep(sessionId, 'contact_details_filled', data, 'completed');
          results.contactDetails = 'completed';
        }

        else if (action === 'submit_form') {
          // Check for error messages
          const errorSelectors = [
            '.error',
            '[role="alert"]',
            '.alert-danger',
            '[class*="error" i]',
            '.validation-error',
          ];

          for (const selector of errorSelectors) {
            try {
              const errorElement = await page.$(selector);
              if (errorElement) {
                const errorText = await errorElement.textContent();
                if (errorText && errorText.trim().length > 0 && !errorText.includes('success')) {
                  throw new Error(`Formulärfel: ${errorText}`);
                }
              }
            } catch (error) {
              // Re-throw if it's our error, otherwise continue
              if (error instanceof Error && error.message.startsWith('Formulärfel:')) {
                throw error;
              }
            }
          }

          // Click submit button
          const submitSelectors = [
            'button[type="submit"]',
            'button:has-text("Teckna elavtal")',
            'button:has-text("Skicka")',
            'button:has-text("Fortsätt")',
            'button:has-text("Godkänn")',
            'input[type="submit"]',
          ];
          
          let submitted = false;
          for (const selector of submitSelectors) {
            try {
              await page.waitForSelector(selector, { timeout: 3000 });
              await page.click(selector);
              submitted = true;
              break;
            } catch {}
          }

          if (!submitted) {
            throw new Error('Kunde inte hitta skicka-knappen');
          }

          // Wait for redirect to signing page
          await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 });
          
          const currentUrl = page.url();
          const signingUrl = currentUrl.includes('sign') || currentUrl.includes('avtal') || currentUrl.includes('signNow') || currentUrl.includes('bankid')
            ? currentUrl 
            : null;

          await logStep(sessionId, 'form_submitted', { signingUrl }, 'completed', undefined, signingUrl || undefined);
          results.submit = 'completed';
          results.signingUrl = signingUrl || currentUrl;
        }
      } catch (stepError) {
        const errorMsg = stepError instanceof Error ? stepError.message : 'Okänt fel';
        await logStep(sessionId, `${action}_failed`, data, 'failed', errorMsg);
        throw stepError;
      }
    }

    await browser.close();
    return results;
  } catch (error) {
    await browser.close();
    throw error;
  }
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
        const results = await runAutomationSteps(sessionId, steps);
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
