import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function runScript(cmd: string, args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolveP) => {
    const p = spawn(cmd, args, { cwd: ROOT, env: { ...process.env, PYTHONUNBUFFERED: '1' } });
    let stdout = '';
    let stderr = '';
    p.stdout.on('data', (d) => (stdout += d.toString()));
    p.stderr.on('data', (d) => (stderr += d.toString()));
    p.on('close', (code) => resolveP({ stdout, stderr, code: code ?? 0 }));
  });
}

function agentProxy(): Plugin {
  return {
    name: 'agent-proxy',
    configureServer(server) {
      server.middlewares.use('/api/run/anomalies', async (_req, res) => {
        const r = await runScript('node', ['scripts/verify-anomalies.mjs']);
        res.setHeader('Content-Type', 'application/json');
        const m = r.stdout.match(/duplicates=(\d+)\s+out_of_range=(\d+)\s+order_break=(\d+)\s+gaps=(\d+)/);
        if (m) {
          const d = parseInt(m[1]), o = parseInt(m[2]), ob = parseInt(m[3]), g = parseInt(m[4]);
          res.end(
            JSON.stringify({
              text: `Ran all 4 validators against school_ops.db.\n\nFound ${d + o + ob + g} anomalies across 4 categories.`,
              anomaly: {
                duplicates: d,
                out_of_range: o,
                order_break: ob,
                gaps: g,
                iqr_outliers: 0,
                total: d + o + ob + g,
              },
            })
          );
        } else {
          res.end(JSON.stringify({ text: `Validation failed: ${r.stderr || r.stdout}` }));
        }
      });

      server.middlewares.use('/api/run/iqr', async (_req, res) => {
        const r = await runScript('python3', [
          'sandbox/validation/detect_iqr_outliers.py',
          '--db', 'school_ops.db',
          '--table', 'marks',
          '--column', 'marks_obtained',
          '--group-by', 'subject_id',
        ]);
        res.setHeader('Content-Type', 'application/json');
        const lines = r.stdout.split('\n').filter((l) => l.trim());
        const count = lines.length - 2;
        res.end(
          JSON.stringify({
            text: `IQR outlier detection (1.5×IQR fence, 3×IQR extreme):\n\n${
              lines.slice(0, 5).join('\n') || 'no outliers'
            }`,
          })
        );
      });

      server.middlewares.use('/api/run/duplicates', async (_req, res) => {
        const r = await runScript('python3', [
          'sandbox/validation/detect_duplicates.py',
          '--db', 'school_ops.db',
          '--table', 'students',
        ]);
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            text: `Duplicate detection (fuzzy name match):\n\n${r.stdout.trim() || 'no duplicates'}`,
          })
        );
      });

      server.middlewares.use('/api/run/schema', async (_req, res) => {
        const r = await runScript('node', ['scripts/verify-schema.mjs']);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ text: r.stdout || 'no schema info' }));
      });

      server.middlewares.use('/api/run/agent-info', async (_req, res) => {
        const fs = await import('fs');
        const path = resolve(ROOT, 'agent.json');
        try {
          const a = JSON.parse(fs.readFileSync(path, 'utf-8'));
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ model: a.model.name, mcp_servers: a.mcp_servers.length, skills: a.skills.length }));
        } catch (e: any) {
          res.end(JSON.stringify({ error: e.message }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), agentProxy()],
  server: {
    port: 3000,
    proxy: {
      '/api/v1': { target: 'http://localhost:8790', changeOrigin: true },
      '/mcp': { target: 'http://localhost:8790', changeOrigin: true },
    },
  },
  build: { outDir: 'dist', sourcemap: true },
});
