<script lang="ts">
    import Navbar from '$lib/components/Navbar.svelte'
    import Occurrance from '$lib/components/Occurrance.svelte'
    import SavingFor from '$lib/components/SavingFor.svelte'
    import AddCard from '$lib/components/AddCard.svelte'
    import NewRecBill from '$lib/components/NewRecBill.svelte';
    import Paydate from '$lib/components/Paydate.svelte';
    import { getAllCardsByUser } from '$lib/database/database'
    import { onMount } from 'svelte';
    import 'normalize.css';
    import { Button } from '$lib/components/ui/button/index';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    let userCards = $state<any[]>([]);
    let email = $derived(data.email);
    let reoccuringBills = $state<string[]>([]);

    const monthOrder: string[] = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    onMount(async () => {
        if (email) {
            refreshCards(email);
        }
    })

    async function refreshCards(email: string): Promise<void> {
        console.log("running: ", email);
        userCards = await getAllCardsByUser(email);
        userCards.sort((a, b) => {
            return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month)
        });
    }
</script>

<div>
    
    <div class="flex justify-center w-full mt-8">
        <div class="flex w-[65vw] justify-between space-x-8">
            <div class="flex flex-col items-start flex-1 occurance-container space-y-8">
                {#if email}
                    <AddCard cardAdded={() => refreshCards(email!)} email={email} />
                    <NewRecBill recurringBills={data.recurringBills} />
                    <Paydate paydaySettings={data.paydaySettings} />
                {/if}
            </div>
            <!-- <div class="flex-1 occurrence-container space-y-14 overflow-y-auto max-h-[90vh]"> 
                <SavingFor />
            </div> -->
            <div class="flex-[2] occurrence-container space-y-4 overflow-y-auto max-h-[90vh]">
                {#each userCards as card}
                    <Occurrance {card} />
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