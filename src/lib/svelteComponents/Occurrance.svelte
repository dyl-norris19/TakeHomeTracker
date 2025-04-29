<script lang="ts">
    import * as Card from "$lib/components/ui/card/index.js";

    let { card }= $props();

    function calculateSavings(): number {
        if (card.savings.method)
            return Number((card.payAmount * (card.savings.amount * 0.01)).toFixed(2));
        else
            return card.savings.amount
    }

    // console.log(card);
    function calculateTakeHome(): number {
        const reoccurBillsTotal: number = card.reoccurBills.reduce((sum: number, bill:any) => sum + bill.amount, 0);
        const otherBillsTotal:number = card.otherBills.reduce((sum:number, bill:any) => sum + bill.amount, 0);
        const savings: number = calculateSavings();

        return card.payAmount - reoccurBillsTotal - otherBillsTotal - savings;
    }

</script>

<div>
    <Card.Root class="max-w-[50vw] w-full mx-auto">
        <Card.Header>
            <Card.Title class="flex justify-between">
                <p>{card.month}</p>
                <p>Pay: ${card.payAmount}</p>
            </Card.Title>
            <Card.Description>Payday: March 4th</Card.Description>
        </Card.Header>
        <Card.Content>
            {#each card.reoccurBills as bill}
                <p>{bill.name}: ${bill.amount}</p>
            {/each}
            {#each card.otherBills as bill}
                <p>{bill.name}: ${bill.amount}</p>
            {/each}
        </Card.Content>
        <Card.Footer class="flex justify-between">
            <p>Savings: ${calculateSavings()}</p>
            <p>Take Home: ${calculateTakeHome()}</p>
        </Card.Footer>
    </Card.Root>
</div>
