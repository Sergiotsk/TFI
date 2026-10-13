# application/casos-de-uso

Un archivo por acción: preinscribir, acreditar los pagos del informe, cargar documentación, validar
documentación. La **autorización por rol** se verifica acá; RLS es la segunda barrera.

**Antes (propuesta de Santi):** `src/services/` ("reglas de negocio desde el backend y llama a repository").
La diferencia clave: el caso de uso **no** contiene la regla (está en `domain`) y **no** llama a un
repository concreto, sino a un **puerto**.
