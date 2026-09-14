<script lang="ts">
    import * as Card from "$lib/components/ui/card/index.js";
    import { Button } from "$lib/components/ui/button/index";
    import { enhance } from "$app/forms";
    import { formatCents } from "$lib/money";
    import DonutProgress from "$lib/components/DonutProgress.svelte";
    import type { Goal } from "$lib/server/db/queries/savings-goals";

    let { goal }: { goal: Goal } = $props();

    let completed = $derived(goal.completedAt !== null);
</script>

<Card.Root class="w-full" data-completed={completed}>
    <Card.Header class="pb-2">
        <Card.Title class="text-base">{goal.name}</Card.Title>
        {#if completed}
            <Card.Description>Completed ✓</Card.Description>
        {/if}
    </Card.Header>
    <Card.Content class="flex items-center gap-4">
        <DonutProgress value={goal.savedCents} max={goal.targetCents} />
        <p class="text-sm">
            {formatCents(goal.savedCents)} / {formatCents(goal.targetCents)}
        </p>
    </Card.Content>
    <Card.Footer>
        <form method="POST" action="?/setGoalCompleted" use:enhance>
            <input type="hidden" name="goalId" value={goal.id} />
            <input type="hidden" name="completed" value={!completed} />
            <Button type="submit" variant="secondary" size="sm">
                {completed ? "Undo complete" : "Mark complete"}
            </Button>
        </form>
    </Card.Footer>
</Card.Root>
