<script lang="ts">
    import Occurrance from '$lib/components/Occurrance.svelte'
    import AddCard from '$lib/components/AddCard.svelte'
    import NewRecBill from '$lib/components/NewRecBill.svelte';
    import Paydate from '$lib/components/Paydate.svelte';
    import 'normalize.css';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    let email = $derived(data.email);

    let showPaycheckNumber = $derived(!!data.paydaySettings && data.paydaySettings.frequency !== 1);

    let userCards = $derived(
        [...data.cards].sort((a, b) => a.payDate.getTime() - b.payDate.getTime())
    );
</script>

<div>

    <div class="flex justify-center w-full mt-8">
        <div class="flex w-[65vw] justify-between space-x-8">
            <div class="flex flex-col items-start flex-1 occurance-container space-y-8">
                {#if email}
                    <AddCard recurringBills={data.recurringBills} paydaySettings={data.paydaySettings} />
                    <NewRecBill recurringBills={data.recurringBills} />
                    <Paydate paydaySettings={data.paydaySettings} />
                {/if}
            </div>
            <!-- <div class="flex-1 occurrence-container space-y-14 overflow-y-auto max-h-[90vh]">
                <SavingFor />
            </div> -->
            <div class="flex-[2] occurrence-container space-y-4 overflow-y-auto max-h-[90vh]">
                {#each userCards as card (card.id)}
                    <Occurrance {card} {showPaycheckNumber} />
                {/each}
            </div>
        </div>
    </div>
    <!-- <Database/> -->
</div>

<style>
    .occurrence-container::-webkit-scrollbar {
        width: 0px;
        background: transparent;
    }

    .occurrence-container {
        scrollbar-width: none;
    }
</style>
