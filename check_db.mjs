import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    console.log('--- DB Check ---');
    console.log('Checking user: jgararrunategui@gmail.com');
    // 1. Obtener bookings
    const { data: bookings } = await supabase.from('bookings').select('*').eq('customer_email', 'jgararrunategui@gmail.com');
    console.log('Bookings found:', bookings?.length);
    if (bookings && bookings.length > 0) {
        console.log('Booking user_id:', bookings[0].user_id);
    }
    
    // 2. Si hay user_id en booking, revisar auth.users (no podemos con anon key normal, pero sí podemos ver profiles)
    if (bookings && bookings.length > 0 && bookings[0].user_id) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', bookings[0].user_id).single();
        console.log('Profile associated with booking:', profile);
    }

    // 3. Obtener el schema de profiles
    const { data: anyProfile } = await supabase.from('profiles').select('*').limit(1);
    console.log('Profile columns available:', Object.keys(anyProfile?.[0] || {}));
}

check();
