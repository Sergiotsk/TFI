import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { NextConfig } from 'next'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(dirname, '../..'),
  allowedDevOrigins: ['diffusion-purposely-lustrous.ngrok-free.dev'],
}
export default nextConfig
