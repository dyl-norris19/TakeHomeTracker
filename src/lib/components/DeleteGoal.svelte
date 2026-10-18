<script lang="ts">
    import { Button, buttonVariants } from "$lib/components/ui/button/index";
    import * as Dialog from "$lib/components/ui/dialog/index";
    import { enhance } from "$app/forms";
    import { cn } from "$lib/utils.js";
    import { formatCents } from "$lib/money";
    import Trash2 from "@lucide/svelte/icons/trash-2";
    import type { Goal } from "$lib/server/db/queries/savings-goals";

    let { goal }: { goal: Goal } = $props();

    let deleteOpen = $state<boolean>(false);
    let errorMsg = $state<string>("");

    // Drop a failed attempt's message while the dialog is closed, so reopening
    // it starts clean.
    $effect(() => {
        if (!deleteOpen) {
            errorMsg = "";
        }
    });
</script>

<Dialog.Root bind:open={deleteOpen}>
    <Dialog.Trigger
        type="button"
        class={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
        )}
        aria-label="Delete {goal.name}"
    >
        <Trash2 class="h-3.5 w-3.5" />
    </Dialog.Trigger>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title>Delete this goal?</Dialog.Title>
            <Dialog.Description>
                {goal.name} will be permanently deleted.
                {#if goal.savedCents !== 0 || goal.adjustments.length > 0}
                    As well as the {formatCents(goal.savedCents)} saved against it and all
                    adjustments.
                {/if}
            </Dialog.Description>
        </Dialog.Header>
        {#if errorMsg}
            <p class="text-sm text-red-500">{errorMsg}</p>
        {/if}
        <form
            method="POST"
            action="?/deleteGoal"
            use:enhance={() => {
                errorMsg = '';
                return async ({ result, update }) => {
                    await update();
                    if (result.type === 'success') {
                        deleteOpen = false;
                    } else if (result.type === 'failure') {
                        const data = result.data as { goalError?: string } | undefined;
                        errorMsg = data?.goalError ?? 'Something went wrong — try again.';
                    } else {
                        errorMsg = 'Something went wrong — try again.';
                    }
                };
            }}
        >
            <input type="hidden" name="goalId" value={goal.id} />
            <Dialog.Footer>
                <Button type="button" variant="secondary" onclick={() => (deleteOpen = false)}>
                    Cancel
                </Button>
                <Button type="submit" variant="destructive">Delete</Button>
            </Dialog.Footer>
        </form>
    </Dialog.Content>
</Dialog.Root>
