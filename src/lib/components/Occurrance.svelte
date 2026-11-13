<script lang="ts">
    import * as Card from "$lib/components/ui/card/index.js";
    import * as Dialog from "$lib/components/ui/dialog/index";
    import { Button, buttonVariants } from "$lib/components/ui/button/index";
    import Trash2 from "@lucide/svelte/icons/trash-2";
    import Pencil from "@lucide/svelte/icons/pencil";
    import { enhance } from "$app/forms";
    import { cn } from "$lib/utils.js";
    import { budgetBreakdown, formatCents } from "$lib/money";
    import AddCard from "$lib/components/AddCard.svelte";
    import type { Card as CardData } from "$lib/server/db/queries/cards";
    import type { Goal } from "$lib/server/db/queries/savings-goals";
    import type { PaydaySettings } from "$lib/paydates";
    import { formatDueDate } from "$lib/bills";

    let {
        card,
        showPaycheckNumber = false,
        paydaySettings,
        goals = [],
        demo = false
    }: {
        card: CardData;
        showPaycheckNumber?: boolean;
        paydaySettings?: PaydaySettings;
        goals?: Goal[];
        /** The tour's made-up sample card: labelled as an example, with nothing to submit. */
        demo?: boolean;
    } = $props();

    let editOpen = $state<boolean>(false);

    let title = $derived(
        showPaycheckNumber
            ? `${card.month} ${card.year} · Paycheck ${card.paycheckNumber}`
            : `${card.month} ${card.year}`
    );

    let deleteOpen = $state<boolean>(false);

    // All money is integer cents, so these sums and differences are exact — no
    // floating-point drift. The only rounding is inside percentOfCents.
    let breakdown = $derived(budgetBreakdown(card));

    // Where this card's savings went: each goal, then whatever is left as general.
    let savingsBreakdown = $derived.by(() => {
        if (card.goalAllocations.length === 0) {
            return [];
        }
        const parts = card.goalAllocations.map((allocation) => ({
            label: goals.find((goal) => goal.id === allocation.goalId)?.name ?? "Goal",
            amountCents: allocation.amountCents
        }));
        const allocated = parts.reduce((sum, part) => sum + part.amountCents, 0);
        const general = breakdown.savingsCents - allocated;
        if (general > 0) {
            parts.push({ label: "General", amountCents: general });
        }
        return parts;
    });

    function secondsToDate(): string {
        const date = new Date(card.payDate);

        const day = date.getDate();
        const year = date.getFullYear();
        const month = date.toLocaleString("default", { month: "long" });

        const getOrdinalSuffix = (n: number): string => {
            if (n >= 11 && n <= 13) return "th";
            switch (n % 10) {
                case 1: return "st";
                case 2: return "nd";
                case 3: return "rd";
                default: return "th";
            }
        };

        return `${month} ${day}${getOrdinalSuffix(day)}, ${year}`;
    }

</script>

<div data-tour="card">
    <Card.Root class="max-w-[960px] w-full mx-auto">
        <Card.Header>
            <!-- Phones: title on the left with the edit/delete buttons on the right, then
                 the pay on its own line underneath, left aligned (order-3 + w-full).
                 sm and up: title on the left, pay and buttons together on the right. -->
            <Card.Title class="flex flex-wrap items-center gap-x-3 gap-y-2 text-lg sm:text-2xl">
                <p class="min-w-0 flex-1">{title}</p>
                <p class="order-3 w-full sm:order-none sm:w-auto">Pay: {formatCents(card.payAmountCents)}</p>
                <div class="flex shrink-0 items-center gap-1 sm:gap-3">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        class="h-8 w-8 text-muted-foreground hover:text-foreground"
                        aria-label="Edit card"
                        data-tour="card-edit"
                        onclick={() => (editOpen = true)}
                    >
                        <Pencil class="h-4 w-4" />
                    </Button>
                    <!-- The sample card is only there to look at, so it has no edit or delete forms. -->
                    {#if !demo}
                        <AddCard cardToEdit={card} {paydaySettings} {goals} bind:open={editOpen} />
                        <Dialog.Root bind:open={deleteOpen}>
                            <Dialog.Trigger
                                type="button"
                                class={cn(
                                    buttonVariants({ variant: "ghost", size: "icon" }),
                                    "h-8 w-8 text-muted-foreground hover:text-destructive"
                                )}
                                aria-label="Delete card"
                            >
                                <Trash2 class="h-4 w-4" />
                            </Dialog.Trigger>
                            <Dialog.Content>
                                <Dialog.Header>
                                    <Dialog.Title>Delete this card?</Dialog.Title>
                                    <Dialog.Description>
                                        The {card.month} card will be permanently deleted. This can't be undone.
                                    </Dialog.Description>
                                </Dialog.Header>
                                <form
                                    method="POST"
                                    action="?/deleteCard"
                                    use:enhance={() => {
                                        return async ({ result, update }) => {
                                            await update();
                                            if (result.type === "success") {
                                                deleteOpen = false;
                                            }
                                        };
                                    }}
                                >
                                    <input type="hidden" name="cardId" value={card.id} />
                                    <Dialog.Footer>
                                        <Button type="button" variant="secondary" onclick={() => (deleteOpen = false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" variant="destructive">Delete</Button>
                                    </Dialog.Footer>
                                </form>
                            </Dialog.Content>
                        </Dialog.Root>
                    {/if}
                </div>
            </Card.Title>
            <Card.Description>{demo ? "Example card · not saved" : secondsToDate()}</Card.Description>
        </Card.Header>
        <Card.Content>
            {#each card.reoccurBills as bill, index (bill.name + index)}
                <p>
                    {bill.name}: {formatCents(bill.amountCents)}
                    {#if bill.dueDate}
                        <span class="text-muted-foreground text-xs">(due {formatDueDate(bill.dueDate)})</span>
                    {/if}
                </p>
            {/each}
            {#each card.otherBills as bill, index (bill.name + index)}
                <p>{bill.name}: {formatCents(bill.amountCents)}</p>
            {/each}
            {#if card.notes}
                <p class="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{card.notes}</p>
            {/if}
        </Card.Content>
        <!-- Phones: savings then take home stacked, both left aligned. sm and up: side by side. -->
        <Card.Footer class="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <p>Savings: {formatCents(breakdown.savingsCents)}</p>
                {#if savingsBreakdown.length > 0}
                    <p class="text-sm text-muted-foreground">
                        {savingsBreakdown
                            .map((part) => `${part.label} ${formatCents(part.amountCents)}`)
                            .join(" · ")}
                    </p>
                {/if}
            </div>
            <p>
                {card.budget.mode === "save" ? "Allowance" : "Take Home"}: {formatCents(
                    breakdown.takeHomeCents
                )}
            </p>
        </Card.Footer>
    </Card.Root>
</div>
