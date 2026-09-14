<script lang="ts">
    import * as Card from "$lib/components/ui/card/index.js";
    import * as Dialog from "$lib/components/ui/dialog/index";
    import { Button, buttonVariants } from "$lib/components/ui/button/index";
    import Trash2 from "@lucide/svelte/icons/trash-2";
    import Pencil from "@lucide/svelte/icons/pencil";
    import { enhance } from "$app/forms";
    import { cn } from "$lib/utils.js";
    import { formatCents, savingsCents as cardSavingsCents } from "$lib/money";
    import AddCard from "$lib/components/AddCard.svelte";
    import type { Card as CardData } from "$lib/server/db/queries/cards";
    import type { Goal } from "$lib/server/db/queries/savings-goals";

    let {
        card,
        showPaycheckNumber = false,
        paydaySettings,
        goals = []
    }: {
        card: CardData;
        showPaycheckNumber?: boolean;
        paydaySettings?: { paydate: Date; frequency: number };
        goals?: Goal[];
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
    function savingsCents(): number {
        return card.savings.method === "percent"
            ? cardSavingsCents(card.payAmountCents, "percent", card.savings.basisPoints)
            : cardSavingsCents(card.payAmountCents, "flat", card.savings.flatCents);
    }

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
        const general = savingsCents() - allocated;
        if (general > 0) {
            parts.push({ label: "General", amountCents: general });
        }
        return parts;
    });

    function takeHomeCents(): number {
        const reoccurTotal: number = card.reoccurBills.reduce(
            (sum: number, bill: { amountCents: number }) => sum + bill.amountCents,
            0
        );
        const otherTotal: number = card.otherBills.reduce(
            (sum: number, bill: { amountCents: number }) => sum + bill.amountCents,
            0
        );
        return card.payAmountCents - reoccurTotal - otherTotal - savingsCents();
    }

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

<div>
    <Card.Root class="max-w-[50vw] w-full mx-auto">
        <Card.Header>
            <Card.Title class="flex justify-between items-center">
                <p>{title}</p>
                <div class="flex items-center gap-3">
                    <p>Pay: {formatCents(card.payAmountCents)}</p>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        class="h-8 w-8 text-muted-foreground hover:text-foreground"
                        aria-label="Edit card"
                        onclick={() => (editOpen = true)}
                    >
                        <Pencil class="h-4 w-4" />
                    </Button>
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
                </div>
            </Card.Title>
            <Card.Description>{secondsToDate()}</Card.Description>
        </Card.Header>
        <Card.Content>
            {#each card.reoccurBills as bill, index (bill.name + index)}
                <p>{bill.name}: {formatCents(bill.amountCents)}</p>
            {/each}
            {#each card.otherBills as bill, index (bill.name + index)}
                <p>{bill.name}: {formatCents(bill.amountCents)}</p>
            {/each}
            {#if card.notes}
                <p class="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{card.notes}</p>
            {/if}
        </Card.Content>
        <Card.Footer class="flex justify-between">
            <div>
                <p>Savings: {formatCents(savingsCents())}</p>
                {#if savingsBreakdown.length > 0}
                    <p class="text-sm text-muted-foreground">
                        {savingsBreakdown
                            .map((part) => `${part.label} ${formatCents(part.amountCents)}`)
                            .join(" · ")}
                    </p>
                {/if}
            </div>
            <p>Take Home: {formatCents(takeHomeCents())}</p>
        </Card.Footer>
    </Card.Root>
</div>
