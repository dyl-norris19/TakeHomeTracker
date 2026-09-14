import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index';
import { savingsGoals } from '$lib/server/db/schema/savings-goals';

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

export async function setGoalCompleted(userId: number, goalId: number, completed: boolean) {
    const result = await db
        .update(savingsGoals)
        .set({ completedAt: completed ? new Date() : null })
        .where(and(eq(savingsGoals.id, goalId), eq(savingsGoals.userId, userId)))
        .returning();

    return result[0];
}
