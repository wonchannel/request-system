import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://biygelcfpogbxrfdhpwu.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpeWdlbGNmcG9nYnhyZmRocHd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNTI4NjEsImV4cCI6MjA3ODkyODg2MX0.kQ_rMwnmcg1F92g0TYp4WCnOaD2mE70xioGA6fA6KSo";

export const supabase = createClient(supabaseUrl, supabaseKey);
