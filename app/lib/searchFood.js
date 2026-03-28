import Fuse from 'fuse.js';
import db from './db.js';

let cachedFoods = null;
let fuse = null;

// Funzione interna per caricare e mantenere in memoria la lista (ottimizzazione)
function getFoods() {
  if (!cachedFoods) {
    console.log("[CREA DB] Caricamento in memoria degli alimenti per ricerca veloce...");
    const stmt = db.prepare('SELECT * FROM foods');
    cachedFoods = stmt.all();
    
    // Inizializza Fuse.js su questa lista
    fuse = new Fuse(cachedFoods, {
      keys: ['name', 'category'],
      threshold: 0.3, // 0.0 è match perfetto, 1.0 accetta qualsiasi cosa
      includeScore: true,
      shouldSort: true
    });
  }
  return { cachedFoods, fuse };
}

/**
 * Cerca una singola query nel database CREA usando Fuzzy matching.
 * @param {string} query Il nome dell'ingrediente cercato (es. "pollo")
 * @returns {object|null} L'elemento trovato, con i macros esatti, oppure null
 */
export function searchSingleFood(query) {
  const { fuse } = getFoods();
  
  // Esegui la ricerca con fuse
  const results = fuse.search(query);
  if (results && results.length > 0) {
    // result[0].item è l'alimento dal DB
    return results[0].item;
  }
  return null;
}

/**
 * Ricerca multipla per Groq.
 * @param {string[]} queries Array di nomi ingredienti (es. ["petto di pollo", "riso"])
 * @returns {object[]} Array degli alimenti trovati con i valori nutrizionali reali.
 */
export function batchSearchFoods(queries) {
  if (!queries || !Array.isArray(queries)) return [];
  
  const results = [];
  for (const q of queries) {
    const found = searchSingleFood(q);
    if (found) {
      results.push({
        query_originale: q,
        ...found
      });
    } else {
      results.push({
        query_originale: q,
        error: "NON_TROVATO",
        message: "Questo ingrediente non esiste nel database nutrizionale"
      });
    }
  }
  return results;
}
