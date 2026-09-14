import { eq, sql } from 'drizzle-orm';
import { db } from '../index';
import { cardGoalAllocations, savingsGoals } from '../schema/savings-goals';

export type Goal = {
    id: number;
    name: string;
    targetCents: number;
    startingCents: number;
    // Starting amount plus every card allocation toward this goal.
    savedCents: number;
    completedAt: Date | null;
};

export async function getGoalsByUser(userId: number): Promise<Goal[]> {
    const rows = await db
        .select({
            id: savingsGoals.id,
            name: savingsGoals.name,
            targetCents: savingsGoals.targetCents,
            startingCents: savingsGoals.startingCents,
            allocatedCents: sql<number>`coalesce(sum(${cardGoalAllocations.amountCents}), 0)`,
            completedAt: savingsGoals.completedAt
        })
        .from(savingsGoals)
        .leftJoin(cardGoalAllocations, eq(cardGoalAllocations.goalId, savingsGoals.id))
        .where(eq(savingsGoals.userId, userId))
        .groupBy(savingsGoals.id)
        .orderBy(savingsGoals.createdAt);

    return rows.map((row) => ({
        id: row.id,
        name: row.name,
        targetCents: row.targetCents,
        startingCents: row.startingCents,
        savedCents: row.startingCents + row.allocatedCents,
        completedAt: row.completedAt
    }));
}
