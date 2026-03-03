-- Fix Supabase Security Advisor Warnings

-- 1. Security Definer View
-- Alterar view para Security Invoker em vez de Definer
ALTER VIEW public.leaderboard_weekly SET (security_invoker = on);

-- 2. Functions with Mutable Search Path
-- Garantir que a execução não possa sofrer override de outros schemas
ALTER FUNCTION public.get_user_role() SET search_path = '';
ALTER FUNCTION public.handle_new_user() SET search_path = '';
ALTER FUNCTION public.sync_role_to_jwt() SET search_path = '';
ALTER FUNCTION public.is_valid_session() SET search_path = '';
ALTER FUNCTION public.get_top_10_lessons() SET search_path = '';
ALTER FUNCTION public.track_auth_session() SET search_path = '';
ALTER FUNCTION public.notify_new_lesson() SET search_path = '';

-- 3. Extension pg_net
-- Embora seja comum, é boa prática isolar a extensão em `extensions`
ALTER EXTENSION pg_net SET SCHEMA extensions;
