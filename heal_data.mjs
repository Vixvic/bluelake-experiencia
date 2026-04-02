const SUPABASE_URL = "https://wklrylecaeepuokqiizt.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrbHJ5bGVjYWVlcHVva3FpaXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NDAzMzQsImV4cCI6MjA4NzExNjMzNH0.Ry2kTG1d9elk2sWkB9_WSHY5PgB4o8EzvlNmsKQOj4o";

async function fetchSupabase(path, method = 'GET', token = null, body = null) {
    const headers = {
        'apikey': ANON_KEY,
        'Content-Type': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (method === 'PATCH' || method === 'POST') headers['Prefer'] = 'return=representation';

    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        method, headers, body: body ? JSON.stringify(body) : undefined
    });

    if (!res.ok) {
        console.error(`Error in ${method} ${path}:`, await res.text());
        return null;
    }
    // Para updates/inserts con Prefer: return=representation, el objeto se devuelve
    // Si la respuesta no tiene body, o es 204 No Content, devuelve null
    if (res.status === 204) return null;
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

async function loginUser() {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: "jgararrunategui@gmail.com", password: "Bluelake43567487" })
    });
    return await res.json();
}

async function run() {
    console.log("1. Accediendo a token de User para obtener su UUID verdadero...");
    const userData = await loginUser();
    if (!userData.user) {
        console.error("No se pudo hacer login al User. Error:", userData);
        return;
    }
    const realUserId = userData.user.id;
    console.log("Real User ID de Jesus:", realUserId);

    console.log("2. Haciendo login como Admin para bypassear RLS...");
    const authData = await loginAdmin();
    const adminToken = authData.access_token;
    
    // 3. Vincular las reservas de Jesus a su ID
    console.log("3. Vinculando reservas...");
    const bookingUpdate = await fetchSupabase(
        `bookings?customer_email=eq.jgararrunategui@gmail.com&user_id=is.null`, 
        'PATCH', 
        adminToken, 
        { user_id: realUserId }
    );
    console.log("Reservas actualizadas:", bookingUpdate ? bookingUpdate.length : 0);

    // 4. Actualizar el perfil (ya que el nombre dice 'Test')
    console.log("4. Reparando nombre en profile...");
    const profileUpdate = await fetchSupabase(
        `profiles?id=eq.${realUserId}`, 
        'PATCH', 
        adminToken, 
        { 
            full_name: "Jesus Garcia Arrunategui", 
            requires_password_change: true 
        }
    );
    console.log("Profile modificado:", profileUpdate ? profileUpdate.length : 0);
}
run();
