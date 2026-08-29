<script lang="ts">
    import * as Card from "$lib/components/ui/card/index.js";
    import * as Dialog from "$lib/components/ui/dialog/index";
    import { Button, buttonVariants } from "$lib/components/ui/button/index";
    import Trash2 from "@lucide/svelte/icons/trash-2";
    import { enhance } from "$app/forms";
    import { cn } from "$lib/utils.js";

    let { card }= $props();

    let deleteOpen = $state<boolean>(false);

    function calculateSavings(): number {
        if (card.savings.method === "percent")
            return Number((card.payAmount * (card.savings.amount * 0.01)).toFixed(2));
        else
            return card.savings.amount
    }

    // console.log(card);
    function calculateTakeHome(): number {
        const reoccurBillsTotal: number = card.reoccurBills.reduce((sum: number, bill: { amount: number }) => sum + bill.amount, 0);
        const otherBillsTotal:number = card.otherBills.reduce((sum:number, bill: { amount: number }) => sum + bill.amount, 0);
        const savings: number = calculateSavings();

        return card.payAmount - reoccurBillsTotal - otherBillsTotal - savings;
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
                <p>{card.month}</p>
                <div class="flex items-center gap-3">
                    <p>Pay: ${card.payAmount}</p>
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
                <p>{bill.name}: ${bill.amount}</p>
            {/each}
            {#each card.otherBills as bill, index (bill.name + index)}
                <p>{bill.name}: ${bill.amount}</p>
            {/each}
        </Card.Content>
        <Card.Footer class="flex justify-between">
            <p>Savings: ${calculateSavings()}</p>
            <p>Take Home: ${calculateTakeHome()}</p>
        </Card.Footer>
    </Card.Root>
</div>
