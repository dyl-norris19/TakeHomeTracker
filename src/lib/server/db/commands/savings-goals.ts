import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index';
import {
    cardGoalAllocations,
    goalAdjustments,
    savingsGoals
} from '$lib/server/db/schema/savings-goals';

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

export type DeleteGoalResult =
    | { deleted: true }
    | { deleted: false; reason: 'not-found' | 'funded-by-cards' };

/**
 * Deletes a goal and its adjustments, but only while no card has allocated to
 * it — that money belongs to the card's record, not the goal's.
 */
export async function deleteGoal(userId: number, goalId: number): Promise<DeleteGoalResult> {
    // Annotated so the literal returns below narrow to DeleteGoalResult instead
    // of widening `reason` to string.
    return db.transaction((tx): DeleteGoalResult => {
        const goal = tx
            .select({ id: savingsGoals.id })
            .from(savingsGoals)
            .where(and(eq(savingsGoals.id, goalId), eq(savingsGoals.userId, userId)))
            .get();
        if (!goal) {
            return { deleted: false, reason: 'not-found' };
        }

        // Existence, not sums: a card that allocated and then zeroed the line
        // still leaves a row.
        const allocation = tx
            .select({ id: cardGoalAllocations.id })
            .from(cardGoalAllocations)
            .where(eq(cardGoalAllocations.goalId, goal.id))
            .get();
        if (allocation) {
            return { deleted: false, reason: 'funded-by-cards' };
        }

        // Children first, as deleteCard does.
        tx.delete(goalAdjustments).where(eq(goalAdjustments.goalId, goal.id)).run();

        tx.delete(savingsGoals).where(eq(savingsGoals.id, goal.id)).run();

        return { deleted: true };
    });
}
