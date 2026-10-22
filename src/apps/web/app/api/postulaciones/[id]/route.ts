import { jsonError } from '@/http/respuesta'

// GET /api/postulaciones/:id: se implementa en la fase de API, con el caso de
// uso ConsultarPostulacion. El stub existe para que el typecheck de Next no
// falle: un route.ts sin exports no es un módulo (TS2306).
export async function GET() {
  return jsonError('NO_IMPLEMENTADO', 'Todavía no está implementado', 501)
}
