-- ============================================================================
-- Row Level Security en todas las tablas de public
-- Sin policies: con RLS activo y sin policies, los roles anon y authenticated no
-- ven ni modifican ninguna fila (falla cerrado). Las policies por rol se definen
-- en T32 (Auth y roles).
-- El toggle "Enable automatic RLS" del proyecto remoto no existe en la base local,
-- por eso RLS se declara acá.
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedure_documents ENABLE ROW LEVEL SECURITY;
