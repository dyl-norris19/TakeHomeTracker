<script lang="ts">
    import * as Card from "$lib/components/ui/card/index.js";

    let { card }= $props();

    // console.log(card);

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
            <p>Rent: ${card.rentAmount}</p>
            {#each card.otherBills as bill}
                <p>{bill.name}: ${bill.amount}</p>
            {/each}
        </Card.Content>
        <Card.Footer class="flex justify-between">
            {#if card.savings.method}
                <p>Savings: ${card.payAmount * (card.savings.amount * .01)}</p>
                <p>Take Home: ${card.payAmount - (card.payAmount * (card.savings.amount * .01))}</p>
            {:else}
                <p>Savings: ${card.savings.amount}</p>
                <p>Take Home: ${card.payAmount - card.savings.amount}</p>
            {/if}
        </Card.Footer>
    </Card.Root>
</div>
