# domain/postulacion

La entidad central: **Postulación** (no "Legajo", que es un concepto de SysAcad). Contiene la máquina de
estados `PREINSCRIPTO → PAGO_PENDIENTE → VACANTE_CONFIRMADA → …` (ver el
[ciclo de vida](../../../../docs/architecture/overview.md)). Las transiciones inválidas se rechazan acá.
Regla central: **pago acreditado = vacante confirmada**.
