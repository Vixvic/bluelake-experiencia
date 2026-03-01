import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL="(.*?)"/);
const keyMatch = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY="(.*?)"/);

if (!urlMatch || !keyMatch) {
    process.exit(1);
}

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function run() {
    const { data: tours } = await supabase.from('tours').select('id, title_es');
    console.log("Tours encontrados:");
    tours.forEach(t => console.log(`- "${t.title_es}"`));

    const targetTour = tours.find(t => t.title_es.includes('Lupuna') || t.title_es.includes('Monos'));
    if (targetTour) {
        console.log(`\nActualizando tour: "${targetTour.title_es}"`);
        const { data: updated, error } = await supabase
            .from('tours')
            .update({ title_es: 'Isla de los Monos - Arbol Lupuna' })
            .eq('id', targetTour.id)
            .select();
        if (error) console.error(error);
        else console.log("Actualizado:", updated);
    } else {
        console.log("No se encontró ningún tour relacionado a Lupuna o Monos");
    }
}

run();
