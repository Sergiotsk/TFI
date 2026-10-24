'use client'

import { useEffect, useState } from 'react'

/**
 * Imágenes opcionales: si el archivo existe se muestra, si no queda el marcador.
 * Equivale a la prueba `new Image()` del main.js del prototipo PHP.
 */
export function useImagenCargada(src: string): boolean {
  const [cargada, setCargada] = useState(false)

  useEffect(() => {
    let vivo = true
    const prueba = new Image()
    prueba.onload = () => {
      if (vivo) setCargada(true)
    }
    prueba.src = src
    return () => {
      vivo = false
    }
  }, [src])

  return cargada
}

/**
 * Devuelve cuáles de las imágenes existen, respetando el orden original.
 * `srcs` tiene que ser una constante estable (declarada fuera del componente).
 */
export function useImagenesCargadas(srcs: readonly string[]): string[] {
  const [cargadas, setCargadas] = useState<string[]>([])

  useEffect(() => {
    let vivo = true
    const existentes = new Set<string>()
    srcs.forEach((src) => {
      const prueba = new Image()
      prueba.onload = () => {
        if (!vivo) return
        existentes.add(src)
        setCargadas(srcs.filter((s) => existentes.has(s)))
      }
      prueba.src = src
    })
    return () => {
      vivo = false
    }
  }, [srcs])

  return cargadas
}
