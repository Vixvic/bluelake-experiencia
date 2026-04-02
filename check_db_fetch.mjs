const SUPABASE_URL = "https://wklrylecaeepuokqiizt.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrbHJ5bGVjYWVlcHVva3FpaXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NDAzMzQsImV4cCI6MjA4NzExNjMzNH0.Ry2kTG1d9elk2sWkB9_WSHY5PgB4o8EzvlNmsKQOj4o";

async function fetchSupabase(path, method = 'GET') {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        method,
        headers: {
            'apikey': ANON_KEY,
            'Authorization': `Bearer ${ANON_KEY}`,
            'Content-Type': 'application/json'
        }
    });
    return await res.json();
}

async function run() {
    console.log("--- DB DIAGNOSTICS ---");
    
    // 1. Get user bookings
    const bookings = await fetchSupabase("bookings?customer_email=eq.jgararrunategui@gmail.com&select=*");
    console.log("Bookings found:", bookings.length);
    if (bookings.length > 0) {
        console.log("Booking user_id:", bookings[0].user_id);
        console.log("Booking ID:", bookings[0].id);
        
        // 2. Profile for user
        if (bookings[0].user_id) {
            const profile = await fetchSupabase(`profiles?id=eq.${bookings[0].user_id}&select=*`);
            console.log("Associated Profile:", profile);
        }
    }
    
    // 3. Just to check columns in profiles
    const anyProfile = await fetchSupabase("profiles?select=*&limit=1");
    if (anyProfile.length > 0) {
        console.log("Profile columns:", Object.keys(anyProfile[0]));
    }
}

run();
