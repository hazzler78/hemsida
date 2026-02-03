import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Note: Playwright requires Node.js runtime, but Cloudflare Pages requires Edge Runtime
// For LOCAL TESTING: Comment out the line below to use Node.js runtime (Playwright will work)
// For CLOUDFLARE PAGES: Uncomment the line below to use Edge Runtime (Playwright will return error)
// Updated: 2026-02-03 - Playwright code restored for local testing
// export const runtime = 'edge'; // COMMENTED OUT FOR LOCAL TESTING

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
  // Check if we're in Edge Runtime (Cloudflare Pages, etc.)
  // Edge Runtime doesn't support Playwright, so return error immediately
  const isEdgeRuntime = typeof globalThis !== 'undefined' && 
    (globalThis.constructor?.name === 'DedicatedWorkerGlobalScope' || 
     globalThis.constructor?.name === 'ServiceWorkerGlobalScope');
  
  if (isEdgeRuntime) {
    await logStep(sessionId, 'runtime_check_failed', {}, 'failed', 'Edge Runtime detected - Playwright requires Node.js runtime');
    throw new Error('Browser automation är inte tillgängligt i Edge Runtime. Denna funktion kräver Node.js runtime och fungerar endast lokalt eller på plattformar som Vercel, Railway, eller Render. För att testa lokalt, kör "npm run dev" och testa via localhost:3000.');
  }

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

  // Set headless: false to see browser window for debugging
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  try {
    // Navigate to Cheap Energy form
    await page.goto(CHEAP_ENERGY_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await logStep(sessionId, 'page_navigated', { url: CHEAP_ENERGY_URL }, 'completed');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
      // If networkidle times out, continue anyway
      console.log('Network idle timeout, continuing...');
    });
    
    // Wait for initial load (5 seconds as mentioned)
    await page.waitForTimeout(5000);
    
    // Take initial screenshot for debugging
    await page.screenshot({ path: `debug-initial-${sessionId}.png`, fullPage: true });
    await logStep(sessionId, 'initial_screenshot', { screenshot: `debug-initial-${sessionId}.png` }, 'completed');
    
    // Check for common overlays/modals that might block the form
    // Cookie banners, popups, etc. - try multiple strategies
    const cookieSelectors = [
      'button:has-text("Acceptera")',
      'button:has-text("Godkänn")',
      'button:has-text("Accept")',
      'button:has-text("Acceptera alla")',
      'button:has-text("Godkänn alla")',
      '[id*="cookie"] button',
      '[class*="cookie"] button',
      '[id*="Cookie"] button',
      '[class*="Cookie"] button',
      '[data-testid*="cookie"] button',
      '[aria-label*="cookie" i] button',
      '[aria-label*="acceptera" i]',
      '[aria-label*="godkänn" i]',
    ];
    
    // Try to find and click cookie banner
    let cookieClicked = false;
    for (const selector of cookieSelectors) {
      try {
        const cookieButton = await page.$(selector);
        if (cookieButton) {
          const isVisible = await cookieButton.isVisible();
          if (isVisible) {
            await cookieButton.scrollIntoViewIfNeeded();
            await page.waitForTimeout(500);
            await cookieButton.click();
            await page.waitForTimeout(2000);
            await logStep(sessionId, 'cookie_accepted', { selector }, 'completed');
            cookieClicked = true;
            break;
          }
        }
      } catch (error) {
        continue;
      }
    }
    
    // Also try to find cookie banner by looking for common cookie banner text
    if (!cookieClicked) {
      try {
        const cookieTexts = await page.$$eval('button', buttons => 
          buttons
            .map(btn => ({ text: btn.textContent?.toLowerCase() || '', element: btn }))
            .filter(btn => 
              btn.text.includes('acceptera') || 
              btn.text.includes('godkänn') || 
              btn.text.includes('accept') ||
              btn.text.includes('cookie')
            )
        );
        
        for (const cookieText of cookieTexts) {
          try {
            const button = cookieText.element as any;
            if (button && await page.evaluate((el) => el.offsetParent !== null, button)) {
              await button.scrollIntoViewIfNeeded();
              await page.waitForTimeout(500);
              await button.click();
              await page.waitForTimeout(2000);
              await logStep(sessionId, 'cookie_accepted_text', { text: cookieText.text }, 'completed');
              cookieClicked = true;
              break;
            }
          } catch {}
        }
      } catch {}
    }
    
    // Wait a bit more after handling cookies
    if (cookieClicked) {
      await page.waitForTimeout(2000);
    }
    
    // Wait a bit more after closing overlays
    await page.waitForTimeout(2000);
    
    // Take screenshot after closing overlays
    await page.screenshot({ path: `debug-after-overlays-${sessionId}.png`, fullPage: true });
    
    // Log page title and URL for debugging
    const pageTitle = await page.title();
    const pageUrl = page.url();
    
    // Check what forms/inputs are actually on the page
    const pageInfo = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input')).map(input => ({
        name: input.getAttribute('name'),
        id: input.id,
        placeholder: input.getAttribute('placeholder'),
        type: input.type,
        visible: input.offsetParent !== null,
        value: input.value,
      }));
      
      const forms = Array.from(document.querySelectorAll('form')).map(form => ({
        id: form.id,
        action: form.action,
        method: form.method,
        inputs: form.querySelectorAll('input').length,
      }));
      
      const buttons = Array.from(document.querySelectorAll('button')).map(button => ({
        text: button.textContent?.trim().substring(0, 50),
        visible: button.offsetParent !== null,
      }));
      
      return {
        inputs,
        forms,
        buttons: buttons.slice(0, 20), // Limit to first 20 buttons
        bodyText: document.body.textContent?.substring(0, 500), // First 500 chars
      };
    });
    
    await logStep(sessionId, 'page_ready', { 
      title: pageTitle, 
      url: pageUrl,
      screenshot: `debug-after-overlays-${sessionId}.png`,
      pageInfo
    }, 'completed');

    const results: Record<string, unknown> = {};

    // Execute each step in sequence
    for (const step of steps) {
      const { action, data } = step;
      
      try {
        if (action === 'fill_postnummer') {
          // Try multiple selector strategies for postnummer
          const postnummerSelectors = [
            'input[name="postnummer"]',
            'input[placeholder*="postnummer" i]',
            'input[type="text"][id*="post" i]',
            'input[name="zip"]',
            'input[name="postal"]',
            'input[type="text"][placeholder*="post" i]',
            'input#postnummer',
            'input.postnummer',
            'input[data-name="postnummer"]',
            'input[aria-label*="postnummer" i]',
          ];
          
          let found = false;
          for (const selector of postnummerSelectors) {
            try {
              // First, try to find the element (even if hidden)
              const element = await page.$(selector);
              if (element) {
                // Check if it's visible
                const isVisible = await element.isVisible();
                
                if (!isVisible) {
                  // If hidden, try to scroll to it and wait for it to become visible
                  await element.scrollIntoViewIfNeeded();
                  await page.waitForTimeout(1000);
                  
                  // Try to make it visible by clicking nearby or focusing
                  try {
                    await element.focus();
                    await page.waitForTimeout(500);
                  } catch {}
                }
                
                // Try to fill it
                await page.fill(selector, data.postnummer as string);
                await page.keyboard.press('Tab');
                await page.waitForTimeout(2000);
                found = true;
                await logStep(sessionId, 'postnummer_filled', { postnummer: data.postnummer, selector, wasHidden: !isVisible }, 'completed');
                results.postnummer = 'completed';
                break;
              }
            } catch (selectorError) {
              // Try next selector
              continue;
            }
          }
          
          if (!found) {
            // Take screenshot for debugging
            const screenshotPath = `debug-postnummer-${sessionId}.png`;
            await page.screenshot({ path: screenshotPath, fullPage: true });
            
            // Also log all input fields on the page for debugging
            const allInputs = await page.$$eval('input', (inputs) => 
              inputs.map(input => ({
                name: input.getAttribute('name'),
                id: input.id,
                placeholder: input.getAttribute('placeholder'),
                type: input.type,
                visible: input.offsetParent !== null,
              }))
            );
            
            await logStep(sessionId, 'postnummer_selector_failed', { 
              allInputs,
              screenshotPath 
            }, 'failed', 'Kunde inte hitta postnummer-fältet');
            
            throw new Error(`Kunde inte hitta postnummer-fältet. Screenshot sparad som ${screenshotPath}. Hittade ${allInputs.length} input-fält på sidan.`);
          }
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

          // Select betalsätt - try multiple times and strategies
          if (data.betalsatt) {
            const betalsattMap: Record<string, string[]> = {
              'autogiro': ['Autogiro', 'Auto-giro', 'Autogirobetalning', 'Autogiro betalning'],
              'kort': ['Kort', 'Kortbetalning', 'Kort betalning', 'Kreditkort', 'Debitkort'],
              'faktura': ['Faktura', 'Fakturabetalning', 'Faktura betalning', 'Invoice'],
            };
            const betalsattTexts = betalsattMap[data.betalsatt as string] || [data.betalsatt as string];
            
            let betalsattSelected = false;
            
            // Try multiple text variations
            for (const betalsattText of betalsattTexts) {
              const betalsattSelectors = [
                `button:has-text("${betalsattText}")`,
                `[role="button"]:has-text("${betalsattText}")`,
                `button:has-text("${betalsattText}")`,
                `label:has-text("${betalsattText}")`,
                `input[value="${data.betalsatt as string}"]`,
                `input[value="${betalsattText.toLowerCase()}"]`,
                `input[type="radio"][value*="${data.betalsatt as string}"]`,
              ];
              
              for (const selector of betalsattSelectors) {
                try {
                  const element = await page.$(selector);
                  if (element) {
                    const isVisible = await element.isVisible();
                    if (isVisible) {
                      await element.scrollIntoViewIfNeeded();
                      await page.waitForTimeout(500);
                      await element.click();
                      await page.waitForTimeout(1000);
                      betalsattSelected = true;
                      await logStep(sessionId, 'betalsatt_selected', { 
                        betalsatt: data.betalsatt, 
                        selector,
                        text: betalsattText 
                      }, 'completed');
                      break;
                    }
                  }
                } catch {}
              }
              
              if (betalsattSelected) break;
            }
            
            // If not found, try clicking by finding all payment options and matching text
            if (!betalsattSelected) {
              try {
                const paymentOptions = await page.$$eval('button, [role="button"], label, input[type="radio"]', (elements) => 
                  elements
                    .map(el => ({
                      text: el.textContent?.toLowerCase() || '',
                      tagName: el.tagName,
                      value: (el as HTMLInputElement).value || '',
                      element: el
                    }))
                    .filter(el => 
                      el.text.includes('autogiro') || 
                      el.text.includes('kort') || 
                      el.text.includes('faktura') ||
                      el.value.includes('autogiro') ||
                      el.value.includes('kort') ||
                      el.value.includes('faktura')
                    )
                );
                
                const targetValue = (data.betalsatt as string).toLowerCase();
                for (const option of paymentOptions) {
                  if (
                    (targetValue === 'autogiro' && (option.text.includes('autogiro') || option.value.includes('autogiro'))) ||
                    (targetValue === 'kort' && (option.text.includes('kort') && !option.text.includes('autogiro') || option.value.includes('kort'))) ||
                    (targetValue === 'faktura' && (option.text.includes('faktura') || option.value.includes('faktura')))
                  ) {
                    const element = option.element as any;
                    if (await page.evaluate((el) => el.offsetParent !== null, element)) {
                      await element.scrollIntoViewIfNeeded();
                      await page.waitForTimeout(500);
                      await element.click();
                      await page.waitForTimeout(1000);
                      betalsattSelected = true;
                      await logStep(sessionId, 'betalsatt_selected_fallback', { 
                        betalsatt: data.betalsatt, 
                        optionText: option.text 
                      }, 'completed');
                      break;
                    }
                  }
                }
              } catch {}
            }
            
            // Try one more time after a delay (sometimes the form needs time to update)
            if (betalsattSelected) {
              await page.waitForTimeout(2000);
              // Verify it was selected by trying again
              try {
                const verifySelectors = [
                  `input[type="radio"][value*="${data.betalsatt as string}"]:checked`,
                  `button:has-text("${betalsattTexts[0]}")[aria-pressed="true"]`,
                ];
                for (const selector of verifySelectors) {
                  const verified = await page.$(selector);
                  if (!verified) {
                    // Try clicking again
                    const retrySelectors = [
                      `button:has-text("${betalsattTexts[0]}")`,
                      `input[type="radio"][value*="${data.betalsatt as string}"]`,
                    ];
                    for (const retrySelector of retrySelectors) {
                      try {
                        const retryElement = await page.$(retrySelector);
                        if (retryElement && await retryElement.isVisible()) {
                          await retryElement.click();
                          await page.waitForTimeout(1000);
                        }
                      } catch {}
                    }
                  }
                }
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
       globalThis.constructor?.name === 'ServiceWorkerGlobalScope');
    
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
      data,
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

    // Single step execution (for backward compatibility)
    // Note: These actions are now handled by runAutomationSteps with steps array
    // Keeping for backward compatibility but recommending using steps array instead
    if (action === 'fill_postnummer' || action === 'fill_forbrukning' || 
        action === 'select_contract_type' || action === 'fill_personnummer' ||
        action === 'confirm_address' || action === 'fill_contact_details' ||
        action === 'submit_form') {
      return NextResponse.json({ 
        error: 'Använd "steps" array för att köra automation',
        message: 'För att köra automation, skicka en "steps" array med alla steg i sekvens.'
      }, { status: 400 });
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
