
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const http = require('http');
const https = require('https');

function createWindow(){
  const win = new BrowserWindow({
    width: 1440,
    height: 980,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile('index.html');
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if(process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if(BrowserWindow.getAllWindows().length === 0) createWindow(); });

function requestRaw(urlString, options = {}){
  return new Promise((resolve, reject) => {
    let url;
    try { url = new URL(urlString); } catch(e){ return reject(new Error('Invalid URL: ' + urlString)); }
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;
    const body = options.body || null;
    const headers = Object.assign({}, options.headers || {});
    if(body && !headers['Content-Length']) headers['Content-Length'] = Buffer.byteLength(body);

    const req = lib.request({
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers,
      rejectUnauthorized: options.rejectUnauthorized !== false
    }, res => {
      let chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let json = null;
        try { json = text ? JSON.parse(text) : null; } catch(e) {}
        resolve({ status: res.statusCode, headers: res.headers, text, json, ok: res.statusCode >= 200 && res.statusCode < 300 });
      });
    });
    req.on('error', reject);
    if(body) req.write(body);
    req.end();
  });
}

ipcMain.handle('otds-token', async (_event, payload) => {
  const form = new URLSearchParams();
  form.append('grant_type', 'password');
  form.append('username', payload.username || '');
  form.append('password', payload.password || '');
  form.append('client_id', payload.clientId || '');
  if(payload.clientSecret) form.append('client_secret', payload.clientSecret);
  if(payload.scope) form.append('scope', payload.scope);

  const result = await requestRaw(payload.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
    body: form.toString(),
    rejectUnauthorized: !payload.allowInsecureTls
  });

  if(!result.ok){
    throw new Error(`Token request failed HTTP ${result.status}: ${result.text || 'No response body'}`);
  }
  const token = result.json?.access_token || result.json?.accessToken || result.json?.token;
  if(!token) throw new Error('Token request succeeded, but no access_token was returned.');
  return { token, tokenType: result.json?.token_type || result.json?.tokenType || 'Bearer', raw: result.json };
});

ipcMain.handle('otds-request', async (_event, payload) => {
  const result = await requestRaw(payload.url, {
    method: payload.method || 'GET',
    headers: payload.headers || {},
    body: payload.body || null,
    rejectUnauthorized: !payload.allowInsecureTls
  });
  return result;
});

ipcMain.handle('show-error', async (_event, message) => {
  dialog.showErrorBox('OTDS Bulk User Creator', String(message || 'Unknown error'));
});
