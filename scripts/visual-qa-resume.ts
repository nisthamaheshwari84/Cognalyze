import { spawn } from 'child_process';
import http from 'http';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

class SimpleCDP {
  ws: WebSocket;
  msgId = 1;
  callbacks = new Map<number, (res: any) => void>();

  constructor(wsUrl: string) {
    // Node 22+ has global WebSocket
    this.ws = new (globalThis as any).WebSocket(wsUrl);
  }

  async connect() {
    if (this.ws.readyState === 1) return;
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
      this.ws.onmessage = (event: any) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          this.callbacks.get(msg.id)!(msg);
          this.callbacks.delete(msg.id);
        }
      };
    });
  }

  send(method: string, params: any = {}): Promise<any> {
    const id = this.msgId++;
    return new Promise((resolve) => {
      this.callbacks.set(id, (res) => resolve(res.result));
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.ws.close();
  }
}

async function run() {
  console.log('=== STARTING VISUAL QA FOR RESUME BUILDER ===');

  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const chromeProc = spawn(chromePath, [
    '--headless',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1400,1200'
  ]);

  try {
    // Wait for CDP endpoint to become ready
    let versionInfo: any = null;
    for (let i = 0; i < 20; i++) {
      try {
        versionInfo = await getJson('http://localhost:9222/json/version');
        if (versionInfo && versionInfo.webSocketDebuggerUrl) break;
      } catch (e) {
        await sleep(300);
      }
    }

    if (!versionInfo) throw new Error('Could not connect to headless Chrome CDP');
    console.log('Connected to Chrome:', versionInfo.Browser);

    const pages = await getJson('http://localhost:9222/json/list');
    const targetWsUrl = pages[0]?.webSocketDebuggerUrl || versionInfo.webSocketDebuggerUrl;

    const cdp = new SimpleCDP(targetWsUrl);
    await cdp.connect();
    console.log('WebSocket connected to CDP');

    await cdp.send('Network.enable');
    await cdp.send('Page.enable');

    // Set auth cookie
    await cdp.send('Network.setCookie', {
      name: 'cognalyze_session',
      value: '75045213c9005c0ccb402146f0e5781889eb8898dea16bb128f8f9e31a0b77e9',
      domain: 'localhost',
      path: '/'
    });
    await cdp.send('Network.setCookie', {
      name: 'cognalyze_role',
      value: 'student',
      domain: 'localhost',
      path: '/'
    });

    // Inject canonical resume into localStorage before page load
    const { createDefaultResumeDocument } = await import('../lib/resume/evidence-tracker');
    const defaultDoc = createDefaultResumeDocument('Nishtha Maheshwari');
    await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        try {
          localStorage.setItem('cognalyze_canonical_resume', ${JSON.stringify(JSON.stringify(defaultDoc))});
        } catch (e) {}
      `
    });

    console.log('Navigating to http://localhost:3000/student/resume?view=editor ...');
    await cdp.send('Page.navigate', { url: 'http://localhost:3000/student/resume?view=editor' });

    // Wait for page to mount and click Open Saved Draft if present
    let loaded = false;
    for (let i = 0; i < 30; i++) {
      await sleep(500);

      // Check if button "Open Saved Draft" is present and click it
      await cdp.send('Runtime.evaluate', {
        expression: `(function() {
          const btns = Array.from(document.querySelectorAll('button'));
          const draftBtn = btns.find(b => b.innerText.includes('Open Saved Draft'));
          if (draftBtn) draftBtn.click();
        })()`
      });

      const evalRes = await cdp.send('Runtime.evaluate', {
        expression: `(function() {
          const sheets = document.querySelectorAll('.resume-page-sheet');
          return {
            sheetCount: sheets.length,
            hasCanvas: !!document.getElementById('resume-live-canvas'),
            bodyTextLen: document.body.innerText.length
          };
        })()`,
        returnByValue: true
      });

      const res = evalRes?.result?.value;
      if (res && res.sheetCount > 0) {
        console.log(`Canvas loaded with ${res.sheetCount} page sheets!`);
        loaded = true;
        break;
      }
    }

    if (!loaded) {
      const pageInfo = await cdp.send('Runtime.evaluate', {
        expression: `document.body.innerText.substring(0, 500)`,
        returnByValue: true
      });
      console.log('Page text snippet:', pageInfo?.result?.value);
      throw new Error('Resume canvas did not load in time');
    }

    // Inspect the rendered sheets in detail
    const sheetData = await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        const sheets = Array.from(document.querySelectorAll('.resume-page-sheet'));
        return sheets.map((sheet, idx) => {
          const headings = Array.from(sheet.querySelectorAll('.section-heading')).map(h => h.innerText);
          const projectItems = Array.from(sheet.querySelectorAll('.project-item')).map(p => ({
            name: p.querySelector('.item-name')?.innerText || '',
            isContinued: !!p.querySelector('span[style*=\"italic\"]'),
            bullets: Array.from(p.querySelectorAll('.bullet-content')).map(b => b.innerText)
          }));
          const expItems = Array.from(sheet.querySelectorAll('.experience-item')).map(e => ({
            role: e.querySelector('.item-role')?.innerText || '',
            company: e.querySelector('.item-company')?.innerText || '',
            bullets: Array.from(e.querySelectorAll('.bullet-content')).map(b => b.innerText)
          }));
          return {
            pageNumber: idx + 1,
            clientHeight: sheet.clientHeight,
            scrollHeight: sheet.scrollHeight,
            headings,
            projectItems,
            expItems,
            hasCognalyzeBullet4: sheet.innerText.includes('Designed real-time live document editor')
          };
        });
      })()`,
      returnByValue: true
    });

    console.log('\n--- BROWSER QA INSPECTION REPORT ---');
    const resultSheets = sheetData.result.value;
    console.log(`Total Rendered A4 Sheets: ${resultSheets.length}`);

    let totalBulletsFound = 0;
    resultSheets.forEach((s: any) => {
      console.log(`\nPage ${s.pageNumber}:`);
      console.log(`  Dimensions: clientHeight=${s.clientHeight}px, scrollHeight=${s.scrollHeight}px`);
      console.log(`  Headings: ${s.headings.join(', ')}`);
      if (s.projectItems.length > 0) {
        console.log(`  Projects:`);
        s.projectItems.forEach((p: any) => {
          console.log(`    - ${p.name} (${p.bullets.length} bullets, continued: ${p.isContinued})`);
          p.bullets.forEach((b: string, bi: number) => {
            console.log(`        [${bi + 1}] ${b.substring(0, 60)}...`);
            totalBulletsFound++;
          });
        });
      }
      if (s.expItems.length > 0) {
        console.log(`  Experience:`);
        s.expItems.forEach((e: any) => {
          console.log(`    - ${e.role} at ${e.company} (${e.bullets.length} bullets)`);
          e.bullets.forEach((b: string, bi: number) => {
            console.log(`        [${bi + 1}] ${b.substring(0, 60)}...`);
            totalBulletsFound++;
          });
        });
      }
      console.log(`  Contains Cognalyze Bullet 4: ${s.hasCognalyzeBullet4}`);
    });

    // Detailed measurement of Page 1 elements
    const p1Measurements = await cdp.send('Runtime.evaluate', {
      expression: `(function() {
        const p1 = document.querySelector('.resume-page-sheet[data-page="1"]');
        if (!p1) return null;
        const styles = window.getComputedStyle(p1);
        return {
          paddingTop: styles.paddingTop,
          paddingBottom: styles.paddingBottom,
          scrollHeight: p1.scrollHeight,
          clientHeight: p1.clientHeight,
          children: Array.from(p1.children).map(c => ({
            tag: c.tagName,
            className: c.className,
            offsetHeight: c.offsetHeight,
            marginTop: window.getComputedStyle(c).marginTop,
            marginBottom: window.getComputedStyle(c).marginBottom,
            text: c.innerText.substring(0, 40)
          }))
        };
      })()`,
      returnByValue: true
    });
    console.log('\nPage 1 Detailed DOM Measurements:', JSON.stringify(p1Measurements?.result?.value, null, 2));

    const hasBullet4 = resultSheets.some((s: any) => s.hasCognalyzeBullet4);
    if (!hasBullet4) {
      throw new Error('FAIL: Cognalyze Bullet 4 is NOT rendered on any page!');
    }
    console.log('\nSUCCESS: Cognalyze Bullet 4 is visibly rendered on the live browser canvas!');
    console.log(`Total project & experience bullets rendered: ${totalBulletsFound}`);

    // Take screenshot
    const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const fs = await import('fs');
    fs.writeFileSync('/tmp/resume-builder-live.png', Buffer.from(screenshot.data, 'base64'));
    console.log('Saved screenshot to /tmp/resume-builder-live.png');

    cdp.close();
  } finally {
    chromeProc.kill();
  }
}

run().catch(err => {
  console.error('VISUAL QA ERROR:', err);
  process.exit(1);
});
