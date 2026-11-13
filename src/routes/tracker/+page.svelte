<script lang="ts">
    import Occurrance from '$lib/components/Occurrance.svelte'
    import AddCard from '$lib/components/AddCard.svelte'
    import NewGoal from '$lib/components/NewGoal.svelte';
    import SavingFor from '$lib/components/SavingFor.svelte';
    import 'normalize.css';
    import { isMonthly } from '$lib/paydates';
    import { tour } from '$lib/tour/tour.svelte';
    import {
        sampleCard,
        sampleCardForm,
        sampleGoal,
        sampleGoalForm,
        samplePaySchedule,
        sampleRecurringBills
    } from '$lib/tour/sample-data';
    import { tick } from 'svelte';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    let email = $derived(data.email);

    let userCards = $derived(data.cards);

    // While the intro tour runs, anything the user hasn't set up yet is stood in
    // for by example data so each step has something to show. None of it is saved
    // (see $lib/tour/sample-data.ts), and the page is inert for as long as it's up.
    const exampleGoal = sampleGoal();
    let paydaySettings = $derived(data.paydaySettings ?? (tour.active ? samplePaySchedule() : undefined));
    let recurringBills = $derived(
        tour.active && data.recurringBills.length === 0 ? sampleRecurringBills() : data.recurringBills
    );
    let goals = $derived(tour.active && data.goals.length === 0 ? [exampleGoal] : data.goals);
    let tourSampleCard = $derived(tour.active && userCards.length === 0 ? sampleCard() : null);

    let showPaycheckNumber = $derived(!!paydaySettings && !isMonthly(paydaySettings));

    // Open goals first, closed ones after; each group keeps the query's newest-first order.
    let sortedGoals = $derived(
        [...goals].sort((a, b) => Number(a.completedAt !== null) - Number(b.completedAt !== null))
    );

    // Tracks whether a scroll area is at each of its edges so the edge fades can
    // be dropped when there's nothing more to scroll toward. One per scroll area.
    // All four edges are tracked because which way an area scrolls depends on the
    // screen: on phones the goals scroll sideways and the page scrolls as a whole,
    // on md and up the goals and cards each scroll vertically. An area that can't
    // scroll in a direction is "at" both of those edges, so it gets no fade there.
    class ScrollFade {
        el: HTMLDivElement | undefined = $state();
        atTop = $state(true);
        atBottom = $state(true);
        atLeft = $state(true);
        atRight = $state(true);

        update = () => {
            if (!this.el) return;
            this.atTop = this.el.scrollTop <= 0;
            this.atBottom = this.el.scrollTop + this.el.clientHeight >= this.el.scrollHeight - 1;
            this.atLeft = this.el.scrollLeft <= 0;
            this.atRight = this.el.scrollLeft + this.el.clientWidth >= this.el.scrollWidth - 1;
        };

        // Nothing to scroll toward, so no edge gets a fade.
        clear = () => {
            this.atTop = true;
            this.atBottom = true;
            this.atLeft = true;
            this.atRight = true;
        };
    }

    const cardsFade = new ScrollFade();
    const goalsFade = new ScrollFade();
    // The whole page, which is what scrolls on phones (it doesn't scroll on md and up).
    const pageFade = new ScrollFade();

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

    // The page's height follows both lists (and the tour's sample card).
    $effect(() => {
        void userCards.length;
        void sortedGoals.length;
        void tourSampleCard;
        tick().then(pageFade.update);
    });

    function updateFades() {
        cardsFade.update();
        goalsFade.update();
        pageFade.update();
    }
</script>

<svelte:window onresize={updateFades} />

<!-- Phones: one column that scrolls as a whole page (buttons, then a sideways
     strip of goals, then the cards). md and up: goals and cards sit side by
     side, each scrolling on its own inside a fixed-height page. -->
<div
    class="occurrence-container h-full overflow-y-auto md:flex md:flex-col md:overflow-hidden"
    class:no-fade-top={pageFade.atTop}
    class:no-fade-bottom={pageFade.atBottom}
    class:no-fade-left={pageFade.atLeft}
    class:no-fade-right={pageFade.atRight}
    bind:this={pageFade.el}
    onscroll={pageFade.update}
    inert={tour.active}
>

    <div class="flex w-full justify-center px-4 py-4 md:min-h-0 md:flex-1 md:px-8 md:py-8">
        <div class="flex w-full max-w-[1250px] flex-col gap-4 md:h-full md:flex-row md:justify-between md:gap-8">
            <div class="flex min-w-0 flex-col gap-4 md:h-full md:flex-1 md:gap-8">
                {#if email}
                    <!-- Fixed section: stays put while the goals below it scroll. -->
                    <div class="flex shrink-0 flex-row items-center gap-3 md:flex-col md:items-start md:gap-8">
                        <!-- data-tour wrappers are what the intro tour highlights (see $lib/tour/steps.ts). -->
                        <div data-tour="new-card">
                            <AddCard
                                {recurringBills}
                                {paydaySettings}
                                {goals}
                                sample={tour.active ? sampleCardForm() : undefined}
                                bind:open={tour.dialogs['new-card']}
                            />
                        </div>
                        <div data-tour="new-goal">
                            <NewGoal
                                sample={tour.active ? sampleGoalForm() : undefined}
                                bind:open={tour.dialogs['new-goal']}
                            />
                        </div>
                    </div>
                    {#if sortedGoals.length > 0}
                        <!-- Phones: a swipeable row that bleeds to the screen edges (-mx-4/px-4)
                             so the next goal peeks in. md and up: a vertical scrolling list. -->
                        <div
                            class="occurrence-container -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 -mb-1 md:mx-0 md:mb-0 md:block md:min-h-0 md:flex-1 md:space-y-4 md:overflow-y-auto md:px-0 md:pb-0"
                            class:no-fade-top={goalsFade.atTop}
                            class:no-fade-bottom={goalsFade.atBottom}
                            class:no-fade-left={goalsFade.atLeft}
                            class:no-fade-right={goalsFade.atRight}
                            bind:this={goalsFade.el}
                            onscroll={goalsFade.update}
                        >
                            {#each sortedGoals as goal, index (goal.id)}
                                <SavingFor {goal} tourTarget={index === 0} />
                            {/each}
                        </div>
                    {/if}
                {/if}
            </div>
            <div
                class="occurrence-container space-y-4 md:h-full md:flex-[2] md:overflow-y-auto"
                class:no-fade-top={cardsFade.atTop}
                class:no-fade-bottom={cardsFade.atBottom}
                class:no-fade-left={cardsFade.atLeft}
                class:no-fade-right={cardsFade.atRight}
                bind:this={cardsFade.el}
                onscroll={cardsFade.update}
            >
                {#if tourSampleCard}
                    <Occurrance card={tourSampleCard} {showPaycheckNumber} goals={[exampleGoal]} demo />
                {/if}
                {#each userCards as card (card.id)}
                    <Occurrance
                        {card}
                        {showPaycheckNumber}
                        {paydaySettings}
                        {goals}
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
        height: 0px;
        background: transparent;
    }

    /* Fades an edge of a scroll area to transparent only while there's more
       content to scroll toward it. Two gradients, one per direction, are
       intersected so a single rule covers top/bottom and left/right; each
       edge's fade is switched off (set to solid black) by its no-fade-* class. */
    .occurrence-container {
        scrollbar-width: none;
        --fade-top: transparent;
        --fade-bottom: transparent;
        --fade-left: transparent;
        --fade-right: transparent;
        --fade-mask:
            linear-gradient(to bottom, var(--fade-top), black 2rem, black calc(100% - 2rem), var(--fade-bottom)),
            linear-gradient(to right, var(--fade-left), black 2rem, black calc(100% - 2rem), var(--fade-right));
        mask-image: var(--fade-mask);
        mask-composite: intersect;
        -webkit-mask-image: var(--fade-mask);
        -webkit-mask-composite: source-in;
    }

    .occurrence-container.no-fade-top {
        --fade-top: black;
    }

    .occurrence-container.no-fade-bottom {
        --fade-bottom: black;
    }

    .occurrence-container.no-fade-left {
        --fade-left: black;
    }

    .occurrence-container.no-fade-right {
        --fade-right: black;
    }

    .occurrence-container.no-fade-top.no-fade-bottom.no-fade-left.no-fade-right {
        mask-image: none;
        -webkit-mask-image: none;
    }
</style>
