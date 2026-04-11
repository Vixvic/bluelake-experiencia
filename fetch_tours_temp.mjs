import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://wklrylecaeepuokqiizt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrbHJ5bGVjYWVlcHVva3FpaXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NDAzMzQsImV4cCI6MjA4NzExNjMzNH0.Ry2kTG1d9elk2sWkB9_WSHY5PgB4o8EzvlNmsKQOj4o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('tours').select('included_items, itinerary');
  
  if (error) {
    console.error(error);
    return;
  }
  
  const uniqueItems = new Set();
  const uniqueActivities = new Set();
  
  data.forEach(tour => {
    if (tour.included_items) {
      tour.included_items.forEach(item => {
        if (item) uniqueItems.add(item.trim());
      });
    }
    if (tour.itinerary) {
      tour.itinerary.forEach(step => {
        if (step && step.activity) uniqueActivities.add(step.activity.trim());
      });
    }
  });

  const output = {
    items: Array.from(uniqueItems),
    activities: Array.from(uniqueActivities)
  };
  fs.writeFileSync('tours_terms.json', JSON.stringify(output, null, 2));
}

run();
