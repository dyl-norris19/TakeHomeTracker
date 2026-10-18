<script lang="ts">
    import Occurrance from '$lib/components/Occurrance.svelte'
    import AddCard from '$lib/components/AddCard.svelte'
    import NewRecBill from '$lib/components/NewRecBill.svelte';
    import Paydate from '$lib/components/Paydate.svelte';
    import NewGoal from '$lib/components/NewGoal.svelte';
    import SavingFor from '$lib/components/SavingFor.svelte';
    import 'normalize.css';
    import { tick } from 'svelte';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    let email = $derived(data.email);

    let showPaycheckNumber = $derived(!!data.paydaySettings && data.paydaySettings.frequency !== 1);

    let userCards = $derived(
        [...data.cards].sort((a, b) => a.payDate.getTime() - b.payDate.getTime())
    );

    // Open goals first, closed ones after; each group keeps creation order.
    let sortedGoals = $derived(
        [...data.goals].sort((a, b) => Number(a.completedAt !== null) - Number(b.completedAt !== null))
    );

    // Tracks whether a scroll area is at its top/bottom so the edge fades can
    // be dropped when there's nothing more to scroll toward. One per column.
    class ScrollFade {
        el: HTMLDivElement | undefined = $state();
        atTop = $state(true);
        atBottom = $state(true);

        update = () => {
            if (!this.el) return;
            this.atTop = this.el.scrollTop <= 0;
            this.atBottom = this.el.scrollTop + this.el.clientHeight >= this.el.scrollHeight - 1;
        };

        // Nothing to scroll toward, so neither edge gets a fade.
        clear = () => {
            this.atTop = true;
            this.atBottom = true;
        };
    }

    const cardsFade = new ScrollFade();
    const goalsFade = new ScrollFade();

    // Re-measure after the list length changes, once the DOM has caught up.
    // Reading `length` is also what subscribes these to rows being added or removed.
    $effect(() => {
        if (userCards.length > 0) {
            tick().then(cardsFade.update);
        } else {
            cardsFade.clear();
        }
    });

    $effect(() => {
        if (sortedGoals.length > 0) {
            tick().then(goalsFade.update);
        } else {
            goalsFade.clear();
        }
    });

    function updateFades() {
        cardsFade.update();
        goalsFade.update();
    }
</script>

<svelte:window onresize={updateFades} />

<div class="flex h-full flex-col overflow-hidden">

    <div class="flex w-full flex-1 min-h-0 justify-center px-8 py-8">
        <div class="flex h-full w-full max-w-[1250px] justify-between space-x-8">
            <div class="flex h-full flex-1 flex-col space-y-8">
                {#if email}
                    <!-- Fixed section: stays put while the goals below it scroll. -->
                    <div class="flex shrink-0 flex-col items-start space-y-8">
                        <AddCard
                            recurringBills={data.recurringBills}
                            paydaySettings={data.paydaySettings}
                            goals={data.goals}
                        />
                        <NewRecBill recurringBills={data.recurringBills} />
                        <Paydate paydaySettings={data.paydaySettings} />
                        <NewGoal />
                    </div>
                    {#if sortedGoals.length > 0}
                        <div
                            class="occurrence-container min-h-0 flex-1 space-y-4 overflow-y-auto"
                            class:no-fade-top={goalsFade.atTop}
                            class:no-fade-bottom={goalsFade.atBottom}
                            bind:this={goalsFade.el}
                            onscroll={goalsFade.update}
                        >
                            {#each sortedGoals as goal (goal.id)}
                                <SavingFor {goal} />
                            {/each}
                        </div>
                    {/if}
                {/if}
            </div>
            <div
                class="flex-[2] occurrence-container space-y-4 overflow-y-auto h-full"
                class:no-fade-top={cardsFade.atTop}
                class:no-fade-bottom={cardsFade.atBottom}
                bind:this={cardsFade.el}
                onscroll={cardsFade.update}
            >
                {#each userCards as card (card.id)}
                    <Occurrance
                        {card}
                        {showPaycheckNumber}
                        paydaySettings={data.paydaySettings}
                        goals={data.goals}
                    />
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
