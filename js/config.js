// Supabase connection for the public site.
// Fill these in after following SUPABASE_SETUP.md.
// The anon key is PUBLIC by design — every request is checked against
// Row Level Security policies in the database (see supabase-schema.sql):
// it can only submit commission requests. It cannot read anything.
// The admin key (service_role) is never stored here — it's pasted directly
// into admin.html and kept in the browser's localStorage.
const CONFIG = {
    supabaseUrl: "https://qtluinvlycltaqmrrovq.supabase.co",      // e.g. "https://xxxx.supabase.co"
    supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0bHVpbnZseWNsdGFxbXJyb3ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MDkzNDEsImV4cCI6MjEwNDM4NTM0MX0.etPVswvJDkrb0B08dC05wNE7Kasw5S5quUiCnula-4Q"   // "anon public" key from Project Settings → API
};
