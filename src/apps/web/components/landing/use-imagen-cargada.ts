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
