const Database = require('better-sqlite3');
const path = require('path');

// Create a new database in the project root
const dbPath = path.resolve(process.cwd(), 'database.db');
const db = new Database(dbPath, { verbose: null });

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    protein_target INTEGER NOT NULL,
    sugar_limit INTEGER NOT NULL,
    breakfast_time TEXT NOT NULL,
    snack1_time TEXT NOT NULL,
    lunch_time TEXT NOT NULL,
    snack2_time TEXT NOT NULL,
    dinner_time TEXT NOT NULL,
    workout_time TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    plan TEXT NOT NULL,
    rpe INTEGER
  );

  CREATE TABLE IF NOT EXISTS meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    meal_type TEXT NOT NULL,
    completed BOOLEAN DEFAULT 0
  );
`);

// Insert default user if not exists
const userCountInfo = db.prepare("SELECT COUNT(*) as count FROM users").get();
if (userCountInfo.count === 0) {
  const insertUser = db.prepare(`
    INSERT INTO users (protein_target, sugar_limit, breakfast_time, snack1_time, lunch_time, snack2_time, dinner_time, workout_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  // Default values
  insertUser.run(150, 50, "08:00", "10:30", "13:00", "16:30", "20:00", "18:00");
}

function getUserProfile() {
  return db.prepare("SELECT * FROM users LIMIT 1").get();
}

function updateUserProfile(profile) {
  const stmt = db.prepare(`
    UPDATE users 
    SET protein_target = @protein_target, 
        sugar_limit = @sugar_limit, 
        breakfast_time = @breakfast_time, 
        snack1_time = @snack1_time, 
        lunch_time = @lunch_time, 
        snack2_time = @snack2_time, 
        dinner_time = @dinner_time, 
        workout_time = @workout_time
    WHERE id = 1
  `);
  stmt.run(profile);
}

function getTodayMeals(dateString) {
  const meals = db.prepare("SELECT * FROM meals WHERE date = ?").all(dateString);
  // Default meals if empty
  const defaultTypes = ['breakfast', 'snack1', 'lunch', 'snack2', 'dinner'];
  if (meals.length === 0) {
    const insertMeal = db.prepare("INSERT INTO meals (date, meal_type, completed) VALUES (?, ?, ?)");
    const newMeals = [];
    for (const type of defaultTypes) {
        insertMeal.run(dateString, type, 0);
        newMeals.push({ id: 'temp_' + type, date: dateString, meal_type: type, completed: 0 });
    }
    return newMeals;
  }
  return meals;
}

function toggleMealCompletion(id) {
  const meal = db.prepare("SELECT completed FROM meals WHERE id = ?").get(id);
  if (meal) {
    const newVal = meal.completed ? 0 : 1;
    db.prepare("UPDATE meals SET completed = ? WHERE id = ?").run(newVal, id);
    return newVal;
  }
}

function saveWorkout(date, plan, rpe = null) {
    const stmt = db.prepare("INSERT INTO workouts (date, plan, rpe) VALUES (?, ?, ?)");
    stmt.run(date, plan, rpe);
}

function updateWorkoutRpe(id, rpe) {
    db.prepare("UPDATE workouts SET rpe = ? WHERE id = ?").run(rpe, id);
}

function getLatestWorkout() {
    return db.prepare("SELECT * FROM workouts ORDER BY id DESC LIMIT 1").get();
}

module.exports = {
  db,
  getUserProfile,
  updateUserProfile,
  getTodayMeals,
  toggleMealCompletion,
  saveWorkout,
  updateWorkoutRpe,
  getLatestWorkout
};
