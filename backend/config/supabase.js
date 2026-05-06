const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase URL and Key are missing in .env!");
} else {
  console.log("Supabase URL and Key found. Attempting connection...");
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
