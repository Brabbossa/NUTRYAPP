import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../app/lib/db.js'; // Assumendo che si usi import (moduli ES) o require. Se il progetto è commonjs dovremo adattarlo.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carica il mock dati
const dataPath = path.resolve(__dirname, '../app/lib/crea_mock_data.json');
const rawData = fs.readFileSync(dataPath, 'utf-8');
const foods = JSON.parse(rawData);

console.log(`Trovati ${foods.length} alimenti nel dataset. Inizio caricamento in SQLite...`);

// Inserimento transazionale
const insert = db.prepare(`
  INSERT INTO foods (name, category, energy_kcal, protein_g, lipids_g, carbs_g, fiber_g)
  VALUES (@name, @category, @energy_kcal, @protein_g, @lipids_g, @carbs_g, @fiber_g)
  ON CONFLICT(name) DO UPDATE SET 
    energy_kcal = excluded.energy_kcal,
    protein_g = excluded.protein_g,
    lipids_g = excluded.lipids_g,
    carbs_g = excluded.carbs_g,
    fiber_g = excluded.fiber_g,
    category = excluded.category;
`);

const insertMany = db.transaction((foodsList) => {
  let count = 0;
  for (const food of foodsList) {
    insert.run({
      name: food.name,
      category: food.category || 'Altro',
      energy_kcal: food.energy_kcal,
      protein_g: food.protein_g,
      lipids_g: food.lipids_g,
      carbs_g: food.carbs_g,
      fiber_g: food.fiber_g || 0.0
    });
    count++;
  }
  return count;
});

try {
  const inserted = insertMany(foods);
  console.log(`SUCCESSO: Inseriti/Aggiornati ${inserted} alimenti nel database CREA.`);
} catch (e) {
  console.error("ERRORE durante il seed del DB:", e);
}
