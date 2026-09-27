const fs = require("fs");
const path = require("path");
const envPath = path.join(__dirname, "..", ".env.local");
for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim();
}
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  const { data: list, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) throw listErr;
  const existing = list.users.find((u) => u.email === email);

  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      email_confirm: true,
      password,
    });
    if (error) throw error;
    console.log("confirmed existing user", existing.id);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    console.log("created + confirmed user", data.user.id);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
