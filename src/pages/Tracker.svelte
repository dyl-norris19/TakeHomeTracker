<script lang="ts">
    import Navbar from '$lib/svelteComponents/Navbar.svelte'
    import Occurrance from '$lib/svelteComponents/Occurrance.svelte'
    import SavingFor from '$lib/svelteComponents/SavingFor.svelte'
    import Database from '$lib/svelteComponents/testDatabase.svelte'
    import AddCard from '$lib/svelteComponents/AddCard.svelte'
    import { getAllCardsByUser } from '$lib/database/database'
    import { onMount } from 'svelte';
    import 'normalize.css';
    import { Button } from '$lib/components/ui/button/index';
    import { Link } from 'svelte-routing';

    let userCards = $state<any[]>([]);
    let { trCorner } = $props();
    let email = $state<string>();

    const monthOrder: string[] = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    onMount(async () => {
        email = getCookie('email');
        refreshCards(email);
    })

    async function refreshCards(email: string): Promise<void> {
        console.log("running: ", email);
        userCards = await getAllCardsByUser(email);
        userCards.sort((a, b) => {
            return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month)
        });
    }
    
    function getCookie(name: string): string {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? decodeURIComponent(match[2]) : null;
    }

</script>

<div>
    {@render trCorner()}
    
    <div class="flex justify-center w-full mt-8">
        <div class="flex w-[65vw] justify-between space-x-8">
            <div class="flex-1 occurance-container">
                <AddCard cardAdded={() => refreshCards(email)} {email}/>
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