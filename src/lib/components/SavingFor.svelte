<script lang="ts">
    import * as Card from "$lib/components/ui/card/index.js";
    import { Button } from "$lib/components/ui/button/index";
    import { enhance } from "$app/forms";
    import { formatCents } from "$lib/money";
    import DonutProgress from "$lib/components/DonutProgress.svelte";
    import type { Goal } from "$lib/server/db/queries/savings-goals";

    let { goal }: { goal: Goal } = $props();

    // "completed" is the fact that the target was reached, "closed" is the 
    // decision to stop funding it.
    let closed = $derived(goal.completedAt !== null);
    let completed = $derived(goal.savedCents >= goal.targetCents);

    let badges = $derived(
        [completed ? "Completed ✓" : null, closed ? "Closed" : null].filter(Boolean).join(" · ")
    );
</script>

<Card.Root class="w-full" data-closed={closed}>
    <Card.Header class="pb-2">
        <Card.Title class="text-base">{goal.name}</Card.Title>
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
