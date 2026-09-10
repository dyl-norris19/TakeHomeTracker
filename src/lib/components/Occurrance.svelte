<script lang="ts">
    import * as Card from "$lib/components/ui/card/index.js";
    import * as Dialog from "$lib/components/ui/dialog/index";
    import { Button, buttonVariants } from "$lib/components/ui/button/index";
    import Trash2 from "@lucide/svelte/icons/trash-2";
    import { enhance } from "$app/forms";
    import { cn } from "$lib/utils.js";
    import { formatCents, percentOfCents } from "$lib/money";

    let { card, showPaycheckNumber = false } = $props();

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
            ? percentOfCents(card.payAmountCents, card.savings.basisPoints)
            : card.savings.flatCents;
    }

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
        </Card.Content>
        <Card.Footer class="flex justify-between">
            <p>Savings: {formatCents(savingsCents())}</p>
            <p>Take Home: {formatCents(takeHomeCents())}</p>
        </Card.Footer>
    </Card.Root>
</div>
