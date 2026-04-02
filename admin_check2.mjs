const SUPABASE_URL = "https://wklrylecaeepuokqiizt.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrbHJ5bGVjYWVlcHVva3FpaXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NDAzMzQsImV4cCI6MjA4NzExNjMzNH0.Ry2kTG1d9elk2sWkB9_WSHY5PgB4o8EzvlNmsKQOj4o";

async function fetchSupabase(path, method = 'GET', token = null) {
    const headers = { 'apikey': ANON_KEY, 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { method, headers });
    return await res.json();
}

async function loginAdmin() {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: "victorsudden@gmail.com", password: "Prueba123." })
    });
    return await res.json();
}

async function run() {
    const authData = await loginAdmin();
    const token = authData.access_token;
    
    console.log("\nSearching profiles by phone/name:");
    const byPhone = await fetchSupabase("profiles?phone=eq.946529235&select=*", 'GET', token);
    console.log("By phone:", JSON.stringify(byPhone, null, 2));
    
    // Si no hay con teléfono, busquemos todas para ver cómo están
    if (byPhone && byPhone.length === 0) {
        const all = await fetchSupabase("profiles?select=*&limit=5", 'GET', token);
        console.log("Some profiles:", JSON.stringify(all, null, 2));
    }
}
run();
