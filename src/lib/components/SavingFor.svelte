<script lang="ts">
    import * as Card from "$lib/components/ui/card/index.js";
    import { Button } from "$lib/components/ui/button/index";
    import { enhance } from "$app/forms";
    import { formatCents } from "$lib/money";
    import DonutProgress from "$lib/components/DonutProgress.svelte";
    import EditGoal from "$lib/components/EditGoal.svelte";
    import AdjustGoal from "$lib/components/AdjustGoal.svelte";
    import DeleteGoal from "$lib/components/DeleteGoal.svelte";
    import type { Goal } from "$lib/server/db/queries/savings-goals";
    import { tour } from "$lib/tour/tour.svelte";
    import { sampleAdjustmentForm } from "$lib/tour/sample-data";

    let {
        goal,
        tourTarget = false
    }: {
        goal: Goal;
        /** The goal the intro tour walks through (the first in the list); the tour opens its ± dialog. */
        tourTarget?: boolean;
    } = $props();

    // "completed" is the fact that the target was reached, "closed" is the 
    // decision to stop funding it.
    let closed = $derived(goal.completedAt !== null);
    let completed = $derived(goal.savedCents >= goal.targetCents);

    let badges = $derived(
        [completed ? "Completed ✓" : null, closed ? "Closed" : null].filter(Boolean).join(" · ")
    );
</script>

<!-- data-tour attributes are what the intro tour highlights (see $lib/tour/steps.ts). -->
<!-- Phones show goals in a sideways strip, so each one is a fixed-width snap stop there. -->
<Card.Root class="w-64 shrink-0 snap-start md:w-full" data-closed={closed} data-tour="goal">
    <Card.Header class="pb-2">
        <div class="flex items-start justify-between gap-2">
            <Card.Title class="min-w-0 text-base">{goal.name}</Card.Title>
            <div class="-mr-1 -mt-1 flex shrink-0 items-center gap-0.5" data-tour="goal-actions">
                {#if tourTarget}
                    <AdjustGoal
                        {goal}
                        sample={tour.active ? sampleAdjustmentForm() : undefined}
                        bind:open={tour.dialogs["adjust-goal"]}
                    />
                {:else}
                    <AdjustGoal {goal} />
                {/if}
                <EditGoal {goal} />
                {#if !goal.hasCardAllocations}
                    <!-- A goal a card funds is closed instead of deleted. -->
                    <DeleteGoal {goal} />
                {/if}
            </div>
        </div>
        {#if badges}
            <Card.Description>{badges}</Card.Description>
        {/if}
    </Card.Header>
    <Card.Content class="flex items-center gap-4">
        <DonutProgress value={goal.savedCents} max={goal.targetCents} />
        <p class="min-w-0 text-sm">
            {formatCents(goal.savedCents)} / {formatCents(goal.targetCents)}
        </p>
    </Card.Content>
    <Card.Footer>
        <form method="POST" action="?/setGoalCompleted" use:enhance>
            <input type="hidden" name="goalId" value={goal.id} />
            <input type="hidden" name="completed" value={!closed} />
            <Button type="submit" variant="secondary" size="sm">
                {closed ? "Reopen" : "Close"}
            </Button>
        </form>
    </Card.Footer>
</Card.Root>
