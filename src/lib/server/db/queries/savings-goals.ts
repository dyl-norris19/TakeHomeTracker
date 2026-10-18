import { desc, eq } from 'drizzle-orm';
import { db } from '../index';
import { cardGoalAllocations, goalAdjustments, savingsGoals } from '../schema/savings-goals';

export type GoalAdjustment = {
    id: number;
    // Signed: negative is money taken back out.
    amountCents: number;
    note: string | null;
    createdAt: Date;
};

export type Goal = {
    id: number;
    name: string;
    targetCents: number;
    startingCents: number;
    // Starting amount, plus every card allocation, plus every manual adjustment.
    savedCents: number;
    // Newest first.
    adjustments: GoalAdjustment[];
    completedAt: Date | null;
};

export async function getGoalsByUser(userId: number): Promise<Goal[]> {
    const rows = await db
        .select({
            id: savingsGoals.id,
            name: savingsGoals.name,
            targetCents: savingsGoals.targetCents,
            startingCents: savingsGoals.startingCents,
            completedAt: savingsGoals.completedAt
        })
        .from(savingsGoals)
        .where(eq(savingsGoals.userId, userId))
        .orderBy(savingsGoals.createdAt);

    // The two child tables are fetched separately and summed in JS, the same way
    // getCardsByUser nests its allocations.
    const allocationRows = await db
        .select({
            goalId: cardGoalAllocations.goalId,
            amountCents: cardGoalAllocations.amountCents
        })
        .from(cardGoalAllocations)
        .innerJoin(savingsGoals, eq(cardGoalAllocations.goalId, savingsGoals.id))
        .where(eq(savingsGoals.userId, userId));

    const allocatedByGoal = new Map<number, number>();
    for (const row of allocationRows) {
        allocatedByGoal.set(row.goalId, (allocatedByGoal.get(row.goalId) ?? 0) + row.amountCents);
    }

    const adjustmentRows = await db
        .select({
            id: goalAdjustments.id,
            goalId: goalAdjustments.goalId,
            amountCents: goalAdjustments.amountCents,
            note: goalAdjustments.note,
            createdAt: goalAdjustments.createdAt
        })
        .from(goalAdjustments)
        .innerJoin(savingsGoals, eq(goalAdjustments.goalId, savingsGoals.id))
        .where(eq(savingsGoals.userId, userId))
        .orderBy(desc(goalAdjustments.createdAt));

    const adjustmentsByGoal = new Map<number, GoalAdjustment[]>();
    const adjustedByGoal = new Map<number, number>();
    for (const row of adjustmentRows) {
        const list = adjustmentsByGoal.get(row.goalId) ?? [];
        list.push({
            id: row.id,
            amountCents: row.amountCents,
            note: row.note,
            createdAt: row.createdAt
        });
        adjustmentsByGoal.set(row.goalId, list);
        adjustedByGoal.set(row.goalId, (adjustedByGoal.get(row.goalId) ?? 0) + row.amountCents);
    }

    return rows.map((row) => ({
        id: row.id,
        name: row.name,
        targetCents: row.targetCents,
        startingCents: row.startingCents,
        savedCents:
            row.startingCents +
            (allocatedByGoal.get(row.id) ?? 0) +
            (adjustedByGoal.get(row.id) ?? 0),
        adjustments: adjustmentsByGoal.get(row.id) ?? [],
        completedAt: row.completedAt
    }));
}
