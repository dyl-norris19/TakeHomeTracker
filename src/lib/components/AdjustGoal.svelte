<script lang="ts">
    import { Button, buttonVariants } from "$lib/components/ui/button/index";
    import * as Dialog from "$lib/components/ui/dialog/index";
    import { Input } from "$lib/components/ui/input/index";
    import { Label } from "$lib/components/ui/label/index";
    import { Separator } from "$lib/components/ui/separator/index";
    import { enhance } from "$app/forms";
    import { cn } from "$lib/utils.js";
    import Diff from "@lucide/svelte/icons/diff";
    import X from "@lucide/svelte/icons/x";
    import { validateAdjustmentForm, type AdjustmentFormErrors } from "$lib/validation";
    import { formatCents, parseToCents } from "$lib/money";
    import type { Goal } from "$lib/server/db/queries/savings-goals";

    let { goal }: { goal: Goal } = $props();

    let direction = $state<"add" | "withdraw">("add");
    let amount = $state<string>("");
    let note = $state<string>("");

    let adjustOpen = $state<boolean>(false);
    let fieldErrors = $state<AdjustmentFormErrors>({});
    let errorMsg = $state<string>("");

    // Reset while closed, so each visit starts on a blank entry. Nothing is
    // seeded from the record — adjustments are appended, never edited in place.
    $effect(() => {
        if (!adjustOpen) {
            direction = "add";
            amount = "";
            note = "";
            fieldErrors = {};
            errorMsg = "";
        }
    });

    function validate(): AdjustmentFormErrors {
        return validateAdjustmentForm({ amountCents: parseToCents(amount), note });
    }

    function formatDay(date: Date): string {
        return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }
</script>

{#snippet fieldError(message: string | undefined)}
    {#if message}
        <p class="col-span-full text-sm text-red-500">{message}</p>
    {/if}
{/snippet}

<Dialog.Root bind:open={adjustOpen}>
    <Dialog.Trigger
        type="button"
        class={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "-mt-1 h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
        )}
        aria-label="Add or remove money from {goal.name}"
    >
        <Diff class="h-3.5 w-3.5" />
    </Dialog.Trigger>
    <!-- pb-6 replaces what Dialog.Footer's padding would normally supply: this
         dialog has no footer, and dialog-content itself is px-6 only. -->
    <Dialog.Content class="pb-6">
        <Dialog.Header>
            <Dialog.Title>Adjust {goal.name}</Dialog.Title>
            <Dialog.Description>
                Money in or out that didn't come from a paycheck.
            </Dialog.Description>
        </Dialog.Header>
        {#if errorMsg}
            <p class="text-sm text-red-500">{errorMsg}</p>
        {/if}
        <form
            method="POST"
            action="?/adjustGoal"
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
                        // Keep the dialog open so the new row shows up in the history.
                        amount = '';
                        note = '';
                    } else if (result.type === 'failure') {
                        const data = result.data as
                            | { adjustError?: string; adjustFieldErrors?: AdjustmentFormErrors }
                            | undefined;
                        fieldErrors = data?.adjustFieldErrors ?? {};
                        errorMsg = data?.adjustError ?? 'Something went wrong — try again.';
                    } else {
                        errorMsg = 'Something went wrong — try again.';
                    }
                };
            }}
        >
            <input type="hidden" name="goalId" value={goal.id} />
            <input type="hidden" name="direction" value={direction} />
            <div class="grid gap-4 py-4">
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="adjust-{goal.id}-amount" class="text-right">Amount ($)</Label>
                    <div class="col-span-3 flex items-center gap-2">
                        <!-- The toggle owns the sign so the amount box never needs a minus. -->
                        <div class="flex shrink-0 overflow-hidden rounded-md border">
                            <button
                                type="button"
                                class="px-2.5 py-1.5 text-sm font-semibold transition-colors"
                                class:bg-muted={direction === "add"}
                                class:text-foreground={direction === "add"}
                                class:text-muted-foreground={direction !== "add"}
                                class:hover:text-foreground={direction !== "add"}
                                aria-pressed={direction === "add"}
                                aria-label="Add money"
                                onclick={() => (direction = "add")}
                            >
                                +
                            </button>
                            <button
                                type="button"
                                class="border-l px-2.5 py-1.5 text-sm font-semibold transition-colors"
                                class:bg-muted={direction === "withdraw"}
                                class:text-foreground={direction === "withdraw"}
                                class:text-muted-foreground={direction !== "withdraw"}
                                class:hover:text-foreground={direction !== "withdraw"}
                                aria-pressed={direction === "withdraw"}
                                aria-label="Take money out"
                                onclick={() => (direction = "withdraw")}
                            >
                                −
                            </button>
                        </div>
                        <Input
                            id="adjust-{goal.id}-amount"
                            name="amount"
                            placeholder="Enter Amount"
                            bind:value={amount}
                            class="w-[120px]"
                        />
                    </div>
                    {@render fieldError(fieldErrors.amount)}
                </div>
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="adjust-{goal.id}-note" class="text-right">Note</Label>
                    <Input
                        id="adjust-{goal.id}-note"
                        name="note"
                        placeholder="(Optional) e.g. tax refund"
                        bind:value={note}
                        class="col-span-3"
                    />
                    {@render fieldError(fieldErrors.note)}
                </div>
                <div class="flex justify-end">
                    <Button type="submit">Submit</Button>
                </div>
            </div>
        </form>
        {#if goal.adjustments.length > 0}
            <Separator />
            <div class="space-y-2">
                <h3 class="text-sm font-semibold">History</h3>
                <!-- Each row is its own form; they're siblings of the entry form above,
                     never nested inside it. -->
                <ul class="max-h-40 space-y-1 overflow-y-auto">
                    {#each goal.adjustments as adjustment (adjustment.id)}
                        <li class="flex items-center gap-2 text-sm">
                            <span
                                class="w-24 shrink-0 font-medium"
                                class:text-red-500={adjustment.amountCents < 0}
                            >
                                {adjustment.amountCents < 0 ? "−" : "+"}{formatCents(
                                    Math.abs(adjustment.amountCents)
                                )}
                            </span>
                            <span class="min-w-0 flex-1 truncate text-muted-foreground">
                                {adjustment.note ?? ""}
                            </span>
                            <span class="shrink-0 text-xs text-muted-foreground">
                                {formatDay(adjustment.createdAt)}
                            </span>
                            <form method="POST" action="?/deleteGoalAdjustment" use:enhance>
                                <input
                                    type="hidden"
                                    name="adjustmentId"
                                    value={adjustment.id}
                                />
                                <Button
                                    type="submit"
                                    variant="ghost"
                                    size="icon"
                                    class="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                                    aria-label="Remove this entry"
                                >
                                    <X class="h-3 w-3" />
                                </Button>
                            </form>
                        </li>
                    {/each}
                </ul>
            </div>
        {/if}
    </Dialog.Content>
</Dialog.Root>
