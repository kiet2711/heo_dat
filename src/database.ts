import type { SQLiteDatabase } from 'expo-sqlite';

export type Goal = { id: number; name: string; targetAmount: number; startDate: string; durationDays: number; reminderEnabled: number; reminderHour: number; reminderMinute: number };
export type SavingsDay = { id: number; goalId: number; date: string; directAmount: number; possibleAmount: number; optionalSavedAmount: number; isResolved: number; notificationId: string | null };

export async function migrate(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      target_amount INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      duration_days INTEGER NOT NULL,
      reminder_enabled INTEGER NOT NULL DEFAULT 0,
      reminder_hour INTEGER NOT NULL DEFAULT 20,
      reminder_minute INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS savings_days (
      id INTEGER PRIMARY KEY NOT NULL,
      goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      direct_amount INTEGER NOT NULL DEFAULT 0,
      possible_amount INTEGER NOT NULL DEFAULT 0,
      optional_saved_amount INTEGER NOT NULL DEFAULT 0,
      is_saved INTEGER NOT NULL DEFAULT 0,
      notification_id TEXT
    );
    CREATE UNIQUE INDEX IF NOT EXISTS savings_days_goal_date ON savings_days(goal_id, date);
  `);
  const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(savings_days)');
  const names = new Set(columns.map(column => column.name));
  const hadPossibleAmount = names.has('possible_amount');
  const hadOptionalSavedAmount = names.has('optional_saved_amount');
  if (!names.has('direct_amount')) await db.execAsync('ALTER TABLE savings_days ADD COLUMN direct_amount INTEGER NOT NULL DEFAULT 0');
  if (!hadPossibleAmount) await db.execAsync('ALTER TABLE savings_days ADD COLUMN possible_amount INTEGER NOT NULL DEFAULT 0');
  if (!hadOptionalSavedAmount) await db.execAsync('ALTER TABLE savings_days ADD COLUMN optional_saved_amount INTEGER NOT NULL DEFAULT 0');
  // Preserve existing MVP entries: the old planned value becomes the optional amount.
  if (!hadPossibleAmount && names.has('planned_amount')) await db.execAsync('UPDATE savings_days SET possible_amount = planned_amount');
  if (!hadOptionalSavedAmount && names.has('planned_amount')) await db.execAsync('UPDATE savings_days SET optional_saved_amount = CASE WHEN is_saved = 1 THEN planned_amount ELSE 0 END');
}

export async function listGoals(db: SQLiteDatabase): Promise<Goal[]> {
  const rows = await db.getAllAsync<any>('SELECT * FROM goals ORDER BY id DESC');
  return rows.map(row => ({ id: row.id, name: row.name, targetAmount: row.target_amount, startDate: row.start_date, durationDays: row.duration_days, reminderEnabled: row.reminder_enabled, reminderHour: row.reminder_hour, reminderMinute: row.reminder_minute }));
}

export async function listDays(db: SQLiteDatabase, goalId: number): Promise<SavingsDay[]> {
  const rows = await db.getAllAsync<any>('SELECT * FROM savings_days WHERE goal_id = ? ORDER BY date', goalId);
  return rows.map(row => ({ id: row.id, goalId: row.goal_id, date: row.date, directAmount: row.direct_amount, possibleAmount: row.possible_amount, optionalSavedAmount: row.optional_saved_amount, isResolved: row.is_saved, notificationId: row.notification_id }));
}

export async function createGoal(db: SQLiteDatabase, input: Omit<Goal, 'id'>) {
  const result = await db.runAsync('INSERT INTO goals (name, target_amount, start_date, duration_days, reminder_enabled, reminder_hour, reminder_minute) VALUES (?, ?, ?, ?, ?, ?, ?)', input.name.trim(), input.targetAmount, input.startDate, input.durationDays, input.reminderEnabled, input.reminderHour, input.reminderMinute);
  const goalId = Number(result.lastInsertRowId);
  const first = new Date(`${input.startDate}T12:00:00`);
  for (let index = 0; index < input.durationDays; index++) {
    const date = new Date(first); date.setDate(first.getDate() + index);
    await db.runAsync('INSERT INTO savings_days (goal_id, date) VALUES (?, ?)', goalId, date.toISOString().slice(0, 10));
  }
  return goalId;
}

export async function updateDay(db: SQLiteDatabase, dayId: number, directAmount: number, possibleAmount: number, isResolved: number) {
  await db.runAsync('UPDATE savings_days SET direct_amount = ?, possible_amount = ?, optional_saved_amount = ?, is_saved = ? WHERE id = ?', directAmount, possibleAmount, isResolved ? possibleAmount : 0, isResolved, dayId);
}

/** Past days with an unresolved optional amount become completed at zero optional savings. */
export async function finalizePastDays(db: SQLiteDatabase, today: string): Promise<SavingsDay[]> {
  const stale = await db.getAllAsync<any>('SELECT * FROM savings_days WHERE date < ? AND is_saved = 0', today);
  await db.runAsync('UPDATE savings_days SET is_saved = 1, optional_saved_amount = 0 WHERE date < ? AND is_saved = 0', today);
  return stale.map(row => ({ id: row.id, goalId: row.goal_id, date: row.date, directAmount: row.direct_amount, possibleAmount: row.possible_amount, optionalSavedAmount: row.optional_saved_amount, isResolved: row.is_saved, notificationId: row.notification_id }));
}

export async function setNotificationId(db: SQLiteDatabase, dayId: number, notificationId: string | null) {
  await db.runAsync('UPDATE savings_days SET notification_id = ? WHERE id = ?', notificationId, dayId);
}
