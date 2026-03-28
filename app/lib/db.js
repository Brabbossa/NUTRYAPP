import Database from 'better-sqlite3';
import path from 'path';

// Risolvi il percorso per il db SQLite (nella root del progetto)
const dbPath = path.resolve(process.cwd(), 'crea_nutrition.db');

let db;

try {
  // Inizializza o apre il file database
  db = new Database(dbPath, { verbose: console.log });

  // Crea la tabella se non esiste
  db.exec(`
    CREATE TABLE IF NOT EXISTS foods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      category TEXT,
      energy_kcal REAL NOT NULL,
      protein_g REAL NOT NULL,
      lipids_g REAL NOT NULL,
      carbs_g REAL NOT NULL,
      fiber_g REAL NOT NULL
    );
  `);
  
  console.log("Database SQLite (CREA) pronto.");
} catch (error) {
  console.error("Errore connessione database:", error);
}

export default db;
