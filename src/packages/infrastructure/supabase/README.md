# infrastructure/supabase

El cliente de Supabase, los repositorios que implementan los puertos y los tipos generados de la base.
Los tipos se mapean a entidades del dominio y nunca salen de esta carpeta.

**Antes (propuesta de Santi):**
- `src/repository/` ("lo único que toca la db"): los repositorios van acá e **implementan un puerto**.
- `src/lib/` ("instancia de conexión a la base"): el cliente va acá.
- `src/types/user.types.md`: los tipos de la base se generan con Supabase y quedan acá. Dos ajustes:
  la **contraseña la maneja Supabase Auth**, así que no va en tablas ni tipos propios; y los roles son
  cuatro: Alumno, Secretaría TUP, Director y Administración/Tesorería.
