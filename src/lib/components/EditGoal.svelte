<script lang="ts">
    import { Button, buttonVariants } from "$lib/components/ui/button/index";
    import * as Dialog from "$lib/components/ui/dialog/index";
    import { Input } from "$lib/components/ui/input/index";
    import { Label } from "$lib/components/ui/label/index";
    import { enhance } from "$app/forms";
    import { cn } from "$lib/utils.js";
    import Pencil from "@lucide/svelte/icons/pencil";
    import { validateGoalForm, type GoalFormErrors } from "$lib/validation";
    import { centsToInput, formatCents, parseToCents } from "$lib/money";
    import type { Goal } from "$lib/server/db/queries/savings-goals";

    let { goal }: { goal: Goal } = $props();

    let name = $state<string>("");
    let targetAmount = $state<string>("");

    let editOpen = $state<boolean>(false);
    let fieldErrors = $state<GoalFormErrors>({});
    let errorMsg = $state<string>("");

    // Seed from the record while the dialog is closed, so opening it shows the
    // current values.
    $effect(() => {
        if (!editOpen) {
            name = goal.name;
            targetAmount = centsToInput(goal.targetCents);
            fieldErrors = {};
            errorMsg = "";
        }
    });

    function validate(): GoalFormErrors {
        return validateGoalForm({
            name,
            targetCents: parseToCents(targetAmount),
            // Not editable here; the stored value is left untouched on save.
            startingCents: 0
        });
    }

    let allocatedCents = $derived(goal.savedCents - goal.startingCents);
</script>

{#snippet fieldError(message: string | undefined)}
    {#if message}
        <p class="col-span-full text-sm text-red-500">{message}</p>
    {/if}
{/snippet}

<Dialog.Root bind:open={editOpen}>
    <Dialog.Trigger
        type="button"
        class={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
        )}
        aria-label="Edit {goal.name}"
    >
        <Pencil class="h-3.5 w-3.5" />
    </Dialog.Trigger>
    <Dialog.Content>
        <form
            method="POST"
            action="?/updateGoal"
            use:enhance={({ cancel }) => {
                const errors = validate();
                if (Object.keys(errors).length > 0) {
                    fieldErrors = errors;
                    errorMsg = 'Please fix the highlighted fields.';
                    cancel();
                    return;
                }
                fieldErrors = {};
                errorMsg = '';
                return async ({ result, update }) => {
                    await update({ reset: false });
                    if (result.type === 'success') {
                        editOpen = false;
                    } else if (result.type === 'failure') {
                        const data = result.data as
                            | { goalError?: string; goalFieldErrors?: GoalFormErrors }
                            | undefined;
                        fieldErrors = data?.goalFieldErrors ?? {};
                        errorMsg = data?.goalError ?? 'Something went wrong — try again.';
                    } else {
                        errorMsg = 'Something went wrong — try again.';
                    }
                };
            }}
        >
            <Dialog.Header>
                <Dialog.Title>Edit Savings Goal</Dialog.Title>
                <Dialog.Description>Rename it or change the target.</Dialog.Description>
            </Dialog.Header>
            {#if errorMsg}
                <p class="text-sm text-red-500">{errorMsg}</p>
            {/if}
            <div class="grid gap-4 py-4">
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="goal-{goal.id}-name" class="text-right">Name</Label>
                    <Input
                        id="goal-{goal.id}-name"
                        name="name"
                        placeholder="e.g. Car"
                        bind:value={name}
                        class="col-span-3 w-[180px]"
                    />
                    {@render fieldError(fieldErrors.name)}
                </div>
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="goal-{goal.id}-target" class="text-right">Target ($)</Label>
                    <Input
                        id="goal-{goal.id}-target"
                        name="targetAmount"
                        placeholder="Enter Amount"
                        bind:value={targetAmount}
                        class="col-span-3 w-[180px]"
                    />
                    {@render fieldError(fieldErrors.target)}
                </div>
                <!-- Saved isn't a stored field, it's the starting amount plus every
                     card allocation — so it's changed by editing the card, not here. -->
                <p class="text-sm text-muted-foreground">
                    Saved so far: {formatCents(goal.savedCents)}{#if allocatedCents !== 0}
                        — {formatCents(goal.startingCents)} starting plus
                        {formatCents(allocatedCents)} since then{/if}.
                </p>
            </div>
            <input type="hidden" name="goalId" value={goal.id} />
            <Dialog.Footer>
                <Button type="submit">Save</Button>
            </Dialog.Footer>
        </form>
    </Dialog.Content>
</Dialog.Root>
