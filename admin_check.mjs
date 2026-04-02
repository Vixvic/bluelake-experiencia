const SUPABASE_URL = "https://wklrylecaeepuokqiizt.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrbHJ5bGVjYWVlcHVva3FpaXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NDAzMzQsImV4cCI6MjA4NzExNjMzNH0.Ry2kTG1d9elk2sWkB9_WSHY5PgB4o8EzvlNmsKQOj4o";

async function fetchSupabase(path, method = 'GET', token = null, body = null) {
    const headers = {
        'apikey': ANON_KEY,
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    } else {
        headers['Authorization'] = `Bearer ${ANON_KEY}`;
    }
    
    const options = { method, headers };
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, options);
    try {
        return await res.json();
    } catch {
        return null; // fallback
    }
}

async function loginAdmin() {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
            'apikey': ANON_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: "victorsudden@gmail.com",
            password: "Prueba123."
        })
    });
    return await res.json();
}

async function run() {
    console.log("--- DB DIAGNOSTICS (ADMIN) ---");
    
    // 1. Login
    const authData = await loginAdmin();
    if (!authData.access_token) {
        console.error("Login failed:", authData);
        return;
    }
    
    console.log("Admin login: SUCCESS");
    const token = authData.access_token;
    
    // 2. Query bookings
    console.log("\nSearching bookings for jgararrunategui@gmail.com:");
    const bookings = await fetchSupabase("bookings?customer_email=eq.jgararrunategui@gmail.com&select=*", 'GET', token);
    console.log("Bookings:", JSON.stringify(bookings, null, 2));
    
    // 3. Query auth.users via RPC or just check profile (Wait, REST can't query auth.users, but we can query profiles)
    console.log("\nSearching profile for jgararrunategui@gmail.com:");
    // RLS in profiles allows admins to view all (hopefully)
    let profileId = null;
    if (bookings && bookings.length > 0) {
        profileId = bookings[0].user_id;
    }
    
    if (profileId) {
        const profiles = await fetchSupabase(`profiles?id=eq.${profileId}&select=*`, 'GET', token);
        console.log("Profile by booking user_id:", JSON.stringify(profiles, null, 2));
    } else {
        // Fallback: search profile by email matching if there's a column, else we can't search auth.users from REST easily.
    }
}

run();
