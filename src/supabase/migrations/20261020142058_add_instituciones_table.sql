-- ============================================================================
-- Migration: Add multi-institution support
-- Creates public.institutions and links profiles/procedures to an institution
-- Strategy: nullable -> FK -> backfill -> NOT NULL + indexes
-- ============================================================================

-- 1) Create institutions table
CREATE TABLE IF NOT EXISTS public.institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) updated_at trigger for institutions (use existing function)
DROP TRIGGER IF EXISTS set_institutions_updated_at ON public.institutions;
CREATE TRIGGER set_institutions_updated_at
  BEFORE UPDATE ON public.institutions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3) Default institution (for backfill)
INSERT INTO public.institutions (code, name, active)
VALUES ('FRH', 'UTN FRH', TRUE)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 4) Link profiles to institutions
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS institution_id UUID;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_institution_id_fkey;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_institution_id_fkey
    FOREIGN KEY (institution_id)
    REFERENCES public.institutions(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- Backfill existing profiles to default institution
UPDATE public.profiles
SET institution_id = (
  SELECT id FROM public.institutions WHERE code = 'FRH' LIMIT 1
)
WHERE institution_id IS NULL;

-- Index for filtering
CREATE INDEX IF NOT EXISTS idx_profiles_institution_id
  ON public.profiles (institution_id);

-- Enforce NOT NULL
ALTER TABLE public.profiles
  ALTER COLUMN institution_id SET NOT NULL;

-- ============================================================================
-- 5) Link procedures to institutions
-- ============================================================================

ALTER TABLE public.procedures
  ADD COLUMN IF NOT EXISTS institution_id UUID;

ALTER TABLE public.procedures
  DROP CONSTRAINT IF EXISTS procedures_institution_id_fkey;

ALTER TABLE public.procedures
  ADD CONSTRAINT procedures_institution_id_fkey
    FOREIGN KEY (institution_id)
    REFERENCES public.institutions(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- Try to inherit institution from the owner profile first
UPDATE public.procedures p
SET institution_id = pr.institution_id
FROM public.profiles pr
WHERE p.user_id = pr.id
  AND p.institution_id IS NULL;

-- Fallback just in case there is any procedure without profile match
UPDATE public.procedures
SET institution_id = (
  SELECT id FROM public.institutions WHERE code = 'FRH' LIMIT 1
)
WHERE institution_id IS NULL;

-- Index for filtering
CREATE INDEX IF NOT EXISTS idx_procedures_institution_id
  ON public.procedures (institution_id);

-- Enforce NOT NULL
ALTER TABLE public.procedures
  ALTER COLUMN institution_id SET NOT NULL;

-- ============================================================================
-- 6) Comments
-- ============================================================================

COMMENT ON TABLE public.institutions IS 'Enabled institutions for multi-institution support.';
COMMENT ON COLUMN public.institutions.code IS 'Short unique code (e.g. FRH).';
COMMENT ON COLUMN public.institutions.active IS 'Whether the institution is enabled.';
COMMENT ON COLUMN public.profiles.institution_id IS 'Institution this user/profile belongs to.';
COMMENT ON COLUMN public.procedures.institution_id IS 'Institution this procedure belongs to.';