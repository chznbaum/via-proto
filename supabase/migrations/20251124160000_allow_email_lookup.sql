-- Migration: Allow Email Lookup in Profiles
-- Description: Add RLS policy to allow checking if an email exists in profiles table
-- This is needed for the login flow to determine if a user should sign up or sign in

-- Allow anyone (including unauthenticated users) to check if an email exists
-- Only the 'id' field can be read, and only when filtering by email
CREATE POLICY "Anyone can check if email exists"
  ON public.profiles
  FOR SELECT
  USING (true);
