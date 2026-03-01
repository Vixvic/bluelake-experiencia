import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL="(.*?)"/);
const keyMatch = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY="(.*?)"/);

if (!urlMatch || !keyMatch) {
    console.error("No se pudo leer URL o KEY de .env");
    process.exit(1);
}

const url = urlMatch[1];
const key = keyMatch[1];
const supabase = createClient(url, key);

async function run() {
    console.log("Actualizando 'Isla de los Monos - Lupuna' a 'Isla de los Monos - Arbol Lupuna'...");
    const { data, error } = await supabase
        .from('tours')
        .update({ title_es: 'Isla de los Monos - Arbol Lupuna' })
        .eq('title_es', 'Isla de los Monos - Lupuna')
        .select();

    if (error) {
        console.error("Error al actualizar:", error);
    } else {
        console.log("Actualizado exitosamente:", data);
    }
}

run();
