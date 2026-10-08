import cors, { CorsOptions } from 'cors'

const allowedOrigins = ['http://localhost:3000', '*']

const corsOptions: CorsOptions = {
  origin: allowedOrigins,
  credentials: true,
}

export const corsMiddleware = cors(corsOptions)
