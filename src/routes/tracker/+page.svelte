<script lang="ts">
    import Occurrance from '$lib/components/Occurrance.svelte'
    import AddCard from '$lib/components/AddCard.svelte'
    import NewRecBill from '$lib/components/NewRecBill.svelte';
    import Paydate from '$lib/components/Paydate.svelte';
    import 'normalize.css';
    import { tick } from 'svelte';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    let email = $derived(data.email);

    let showPaycheckNumber = $derived(!!data.paydaySettings && data.paydaySettings.frequency !== 1);

    let userCards = $derived(
        [...data.cards].sort((a, b) => a.payDate.getTime() - b.payDate.getTime())
    );

    let cardsEl: HTMLDivElement | undefined = $state();
    let atTop = $state(true);
    let atBottom = $state(true);

    function updateCardsFade() {
        if (!cardsEl) return;
        atTop = cardsEl.scrollTop <= 0;
        atBottom = cardsEl.scrollTop + cardsEl.clientHeight >= cardsEl.scrollHeight - 1;
    }

    $effect(() => {
        if (!cardsEl || userCards.length < 0) return;
        tick().then(updateCardsFade);
    });
</script>

<svelte:window onresize={updateCardsFade} />

<div class="flex h-full flex-col overflow-hidden">

    <div class="flex w-full flex-1 min-h-0 justify-center py-8">
        <div class="flex h-full w-[65vw] justify-between space-x-8">
            <div class="flex h-full flex-col items-start flex-1 occurance-container space-y-8 overflow-y-auto">
                {#if email}
                    <AddCard recurringBills={data.recurringBills} paydaySettings={data.paydaySettings} />
                    <NewRecBill recurringBills={data.recurringBills} />
                    <Paydate paydaySettings={data.paydaySettings} />
                {/if}
            </div>
            <!-- <div class="flex-1 occurrence-container space-y-14 overflow-y-auto h-full">
                <SavingFor />
            </div> -->
            <div
                class="flex-[2] occurrence-container space-y-4 overflow-y-auto h-full"
                class:no-fade-top={atTop}
                class:no-fade-bottom={atBottom}
                bind:this={cardsEl}
                onscroll={updateCardsFade}
            >
                {#each userCards as card (card.id)}
                    <Occurrance {card} {showPaycheckNumber} paydaySettings={data.paydaySettings} />
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

    /* Fades an edge of the scroll area to transparent only while there's
       more content to scroll toward it*/
    .occurrence-container {
        scrollbar-width: none;
        mask-image: linear-gradient(to bottom, transparent, black 2rem, black calc(100% - 2rem), transparent);
        -webkit-mask-image: linear-gradient(to bottom, transparent, black 2rem, black calc(100% - 2rem), transparent);
    }

    .occurrence-container.no-fade-top {
        mask-image: linear-gradient(to bottom, black, black calc(100% - 2rem), transparent);
        -webkit-mask-image: linear-gradient(to bottom, black, black calc(100% - 2rem), transparent);
    }

    .occurrence-container.no-fade-bottom {
        mask-image: linear-gradient(to bottom, transparent, black 2rem, black);
        -webkit-mask-image: linear-gradient(to bottom, transparent, black 2rem, black);
    }

    .occurrence-container.no-fade-top.no-fade-bottom {
        mask-image: none;
        -webkit-mask-image: none;
    }
</style>
