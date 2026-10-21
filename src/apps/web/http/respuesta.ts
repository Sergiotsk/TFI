import type { NextResponse } from 'next/server'

export type RespuestaHttp<T> =
  | { success: true; data: T }
  | { success: false; error: { codigo: string; mensaje: string } }

export function ok<T>(data: T): RespuestaHttp<T> {
  return { success: true, data }
}

export function error(codigo: string, mensaje: string): RespuestaHttp<never> {
  return { success: false, error: { codigo, mensaje } }
}

export function jsonOk<T>(data: T, status = 200): NextResponse {
  return Response.json(ok(data), { status }) as NextResponse
}

export function jsonError(codigo: string, mensaje: string, status = 400): NextResponse {
  return Response.json(error(codigo, mensaje), { status }) as NextResponse
}
