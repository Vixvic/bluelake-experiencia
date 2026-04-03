// Script temporal para insertar una reserva de prueba
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://wklrylecaeepuokqiizt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrbHJ5bGVjYWVlcHVva3FpaXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NDAzMzQsImV4cCI6MjA4NzExNjMzNH0.Ry2kTG1d9elk2sWkB9_WSHY5PgB4o8EzvlNmsKQOj4o'
);

// Primero logueamos como admin para obtener su user_id
const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
  email: 'victorsudden@gmail.com',
  password: 'Prueba123.',
});

if (authError) {
  console.error('Auth error:', authError);
  process.exit(1);
}

const userId = authData.user.id;
console.log('User ID:', userId);

// Buscar un tour existente
const { data: tours } = await supabase.from('tours').select('id, title_es').limit(1);
if (!tours?.length) {
  console.error('No tours found');
  process.exit(1);
}

const tour = tours[0];
console.log('Tour:', tour.title_es);

// Insertar reserva de prueba
const { data: booking, error: bookingError } = await supabase.from('bookings').insert({
  tour_id: tour.id,
  user_id: userId,
  dates: ['2026-04-15'],
  adults: 2,
  children: 1,
  total_amount: 723,
  payment_mode: 'full',
  payment_method: 'yape',
  status: 'pending',
  customer_name: 'Victor Test',
  customer_email: 'victorsudden@gmail.com',
  customer_phone: '999111222',
  document_type: 'DNI',
  document_number: '12345678',
  notes: 'Reserva de prueba para verificar cancelación',
}).select().single();

if (bookingError) {
  console.error('Booking error:', bookingError);
} else {
  console.log('Booking created:', booking.id);
  console.log('Status:', booking.status);
}

await supabase.auth.signOut();
