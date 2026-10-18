import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index';
import { goalAdjustments, savingsGoals } from '$lib/server/db/schema/savings-goals';

export async function createGoal(
    userId: number,
    data: { name: string; targetCents: number; startingCents: number }
) {
    const result = await db
        .insert(savingsGoals)
        .values({
            userId,
            name: data.name,
            targetCents: data.targetCents,
            startingCents: data.startingCents,
            createdAt: new Date()
        })
        .returning();

    return result[0];
}

export async function updateGoal(
    userId: number,
    goalId: number,
    data: { name: string; targetCents: number }
) {
    // Only the editable fields are set. `startingCents` keeps its stored value,
    // and leaving `completedAt` out is what stops an edit from reopening a
    // closed goal — don't add it here.
    const result = await db
        .update(savingsGoals)
        .set({ name: data.name, targetCents: data.targetCents })
        .where(and(eq(savingsGoals.id, goalId), eq(savingsGoals.userId, userId)))
        .returning();

    return result[0];
}

export async function setGoalCompleted(userId: number, goalId: number, completed: boolean) {
    const result = await db
        .update(savingsGoals)
        .set({ completedAt: completed ? new Date() : null })
        .where(and(eq(savingsGoals.id, goalId), eq(savingsGoals.userId, userId)))
        .returning();

    return result[0];
}

/**
 * Records money moved into or out of a goal outside the paycheck flow. Pass a
 * negative `amountCents` for a withdrawal. Returns undefined when the goal isn't
 * the user's — the ownership check is the guarded select, as in {@link deleteCard}.
 */
export async function createGoalAdjustment(
    userId: number,
    goalId: number,
    data: { amountCents: number; note: string | null }
) {
    return db.transaction((tx) => {
        const goal = tx
            .select({ id: savingsGoals.id })
            .from(savingsGoals)
            .where(and(eq(savingsGoals.id, goalId), eq(savingsGoals.userId, userId)))
            .get();
        if (!goal) {
            return undefined;
        }

        return tx
            .insert(goalAdjustments)
            .values({
                goalId: goal.id,
                amountCents: data.amountCents,
                note: data.note,
                createdAt: new Date()
            })
            .returning()
            .get();
    });
}

/** Removes a single adjustment. Ownership travels through the goal it belongs to. */
export async function deleteGoalAdjustment(userId: number, adjustmentId: number) {
    return db.transaction((tx) => {
        const row = tx
            .select({ id: goalAdjustments.id })
            .from(goalAdjustments)
            .innerJoin(savingsGoals, eq(goalAdjustments.goalId, savingsGoals.id))
            .where(and(eq(goalAdjustments.id, adjustmentId), eq(savingsGoals.userId, userId)))
            .get();
        if (!row) {
            return undefined;
        }

        return tx.delete(goalAdjustments).where(eq(goalAdjustments.id, row.id)).returning().get();
    });
}
