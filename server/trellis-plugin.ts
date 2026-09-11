import { spawn } from 'node:child_process'
import { closeSync, createReadStream, existsSync, mkdirSync, openSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'

// This bridge is started only by the local Vite development server.
export function trellisPlugin(): Plugin {
  return {
    name: 'cmid-local-trellis',
    apply: 'serve',
    async configureServer(server) {
      // Serve newly saved GLBs immediately, before Vite's public-file watcher catches up.
      server.middlewares.use((request, response, next) => {
        const match = /^\/models\/generated\/([a-f0-9]{32})\.glb(?:\?.*)?$/.exec(request.url ?? '')
        if (!match || (request.method !== 'GET' && request.method !== 'HEAD')) return next()
        const file = resolve(server.config.root, 'public/models/generated', `${match[1]}.glb`)
        if (!existsSync(file)) return next()
        response.setHeader('Content-Type', 'model/gltf-binary')
        response.setHeader('Content-Length', statSync(file).size)
        response.setHeader('Cache-Control', 'no-cache')
        if (request.method === 'HEAD') return response.end()
        createReadStream(file).on('error', () => response.destroy()).pipe(response)
      })
      try {
        const response = await fetch('http://127.0.0.1:7861/health', { signal: AbortSignal.timeout(1500) })
        const health = await response.json() as { service?: string }
        if (health.service === 'cmid-trellis') return
        server.config.logger.warn('Port 7861 is occupied; CMID TRELLIS could not start.')
        return
      } catch {
        // Start the local bridge when it is not already running.
      }
      const root = resolve(server.config.root, '../trellis-silicon')
      const python = resolve(root, '.venv/bin/python')
      if (!existsSync(python)) {
        server.config.logger.warn('TRELLIS is not installed. Run trellis-silicon/setup.sh to enable 3D generation.')
        return
      }
      mkdirSync(resolve(root, 'outputs'), { recursive: true })
      const log = openSync(resolve(root, 'outputs/cmid-api.log'), 'a')
      const worker = spawn(python, ['-m', 'trellis_silicon.cmid_api'], {
        cwd: root,
        env: { ...process.env, CMID_MODEL_ASSETS_DIR: resolve(server.config.root, 'public/models/generated') },
        stdio: ['ignore', log, log],
        detached: true,
      })
      closeSync(log)
      worker.on('error', (error) => server.config.logger.warn(`TRELLIS: ${error.message}`))
      // Keep in-flight jobs alive across Vite config changes and page reloads.
      worker.unref()
    },
  }
}
