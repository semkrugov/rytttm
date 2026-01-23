import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Проверка наличия переменных окружения
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "❌ Supabase configuration error: Missing environment variables.\n" +
    "Please check your .env.local file and ensure the following variables are set:\n" +
    "  - NEXT_PUBLIC_SUPABASE_URL\n" +
    "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

// Инициализация клиента Supabase
export const supabase = createClient(
  supabaseUrl || "",
  supabaseAnonKey || ""
);
