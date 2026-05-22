import { RecurringTransaction, Transaction } from './types';
import { generateId, getToday } from './utils';
import {
  getAllRecurringTransactions,
  addTransaction as dbAddTransaction,
  updateRecurringTransaction,
} from './db';
import { parseISO, addDays, addWeeks, addMonths, addYears, isBefore, isSameDay } from 'date-fns';

export async function generateDueRecurringTransactions(): Promise<void> {
  const recurringTxs = await getAllRecurringTransactions();
  const today = new Date(); // local time

  for (const rt of recurringTxs) {
    if (!rt.isActive) continue;

    const start = parseISO(rt.startDate);
    const end = rt.endDate ? parseISO(rt.endDate) : null;
    let lastGenerated = rt.lastGeneratedDate ? parseISO(rt.lastGeneratedDate) : null;

    // If it hasn't started yet
    if (isBefore(today, start) && !isSameDay(today, start)) continue;

    // Determine the next date to generate
    let nextDate = lastGenerated ? getNextDate(lastGenerated, rt.frequency) : start;

    let updated = false;

    // Generate while nextDate is on or before today, and before end date (if any)
    while ((isBefore(nextDate, today) || isSameDay(nextDate, today)) && (!end || isBefore(nextDate, end) || isSameDay(nextDate, end))) {
      const dateStr = nextDate.toISOString().split('T')[0];
      
      const newTx: Transaction = {
        id: generateId(),
        type: rt.type,
        amount: rt.amount,
        currency: rt.currency,
        category: rt.category,
        description: rt.description,
        date: dateStr,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        recurringId: rt.id,
        notes: rt.notes,
      };

      await dbAddTransaction(newTx);
      
      lastGenerated = nextDate;
      rt.lastGeneratedDate = dateStr;
      updated = true;

      // advance nextDate
      nextDate = getNextDate(nextDate, rt.frequency);
    }

    if (updated && rt.lastGeneratedDate) {
      await updateRecurringTransaction(rt.id, { lastGeneratedDate: rt.lastGeneratedDate });
    }
  }
}

function getNextDate(date: Date, frequency: RecurringTransaction['frequency']): Date {
  switch (frequency) {
    case 'daily':
      return addDays(date, 1);
    case 'weekly':
      return addWeeks(date, 1);
    case 'monthly':
      return addMonths(date, 1);
    case 'yearly':
      return addYears(date, 1);
  }
}
