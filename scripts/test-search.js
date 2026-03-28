import { batchSearchFoods } from '../app/lib/searchFood.js';

const results = batchSearchFoods(['petto pollo', 'riso', 'whey', 'olio extra vergine d\'oliva', 'pizza finta', 'avena']);
console.log(JSON.stringify(results, null, 2));
