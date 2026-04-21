#!/usr/bin/env node
/**
 * GitHub Webhook Handler for SMAVO
 * Listens on port 9000 for GitHub push events and redeploys
 */
const http = require('http');
const crypto = require('crypto');
const { exec } = require('child_process');

const SECRET = process.env.WEBHOOK_SECRET || '';
const PORT = process.env.WEBHOOK_PORT || 9000;
const PROJECT_DIR = process.env.PROJECT_DIR || '/opt/smavo';
const LOG_FILE = '/var/log/smavo-webhook.log';
const fs = require('fs');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  process.stdout.write(line);
  fs.appendFileSync(LOG_FILE, line);
}

function verifySignature(body, signature) {
  if (!SECRET) return true; // No secret configured, skip verification
  const hmac = crypto.createHmac('sha256', SECRET);
  hmac.update(body);
  const expected = 'sha256=' + hmac.digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

const server = http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/webhook') {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    const signature = req.headers['x-hub-signature-256'] || '';
    if (!verifySignature(body, signature)) {
      log('⚠ Signature verification failed');
      res.writeHead(401);
      res.end('Unauthorized');
      return;
    }

    let payload;
    try {
      payload = JSON.parse(body);
    } catch {
      res.writeHead(400);
      res.end('Bad Request');
      return;
    }

    const branch = payload.ref?.replace('refs/heads/', '');
    log(`📦 Push received on branch: ${branch}`);

    if (branch !== 'main') {
      log('⏭ Not main branch, skipping deploy');
      res.writeHead(200);
      res.end('Skipped');
      return;
    }

    res.writeHead(200);
    res.end('Deploy triggered');

    log('🚀 Starting deploy...');
    const cmd = `cd ${PROJECT_DIR} && git pull origin main && docker compose up -d --build 2>&1 >> ${LOG_FILE}`;
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        log(`❌ Deploy failed: ${err.message}`);
      } else {
        log('✅ Deploy completed successfully');
      }
    });
  });
});

server.listen(PORT, '127.0.0.1', () => {
  log(`🎣 Webhook server listening on port ${PORT}`);
});
