const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("⚠️ Error: Missing Supabase URL or Key in backend/.env!");
}

// Supabase Client ইনিশিয়ালাইজ করা
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;

