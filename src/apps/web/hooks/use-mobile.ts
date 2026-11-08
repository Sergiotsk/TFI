import * as React from "react"

const MOBILE_BREAKPOINT = 768
const CONSULTA = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

// useSyncExternalStore en vez del useEffect + setState que trae shadcn: la regla react-hooks/set-state-in-effect
// lo rechaza, y así React lee el valor sin un render extra. En el servidor se asume escritorio.
function suscribir(alCambiar: () => void) {
  const mql = window.matchMedia(CONSULTA)
  mql.addEventListener("change", alCambiar)
  return () => mql.removeEventListener("change", alCambiar)
}

export function useIsMobile() {
  return React.useSyncExternalStore(
    suscribir,
    () => window.matchMedia(CONSULTA).matches,
    () => false,
  )
}
