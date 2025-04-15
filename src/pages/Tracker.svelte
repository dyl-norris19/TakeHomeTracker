<script lang="ts">
    import Navbar from '$lib/svelteComponents/Navbar.svelte'
    import Occurrance from '$lib/svelteComponents/Occurrance.svelte'
    import SavingFor from '$lib/svelteComponents/SavingFor.svelte'
    import Database from '$lib/svelteComponents/testDatabase.svelte'
    import AddCard from '$lib/svelteComponents/AddCard.svelte'
    import { getAllCardsByUser } from '$lib/database/database'
    import { onMount } from 'svelte';
    import 'normalize.css';

    let userCards = [];

    onMount(async () => {
        userCards = await getAllCardsByUser("meow@gmail.com");
    })

    async function refreshCards() {
        userCards = await getAllCardsByUser("meow@gmail.com");
    }

  </script>
  
  <div>
    <Navbar />
    <div class="flex justify-center w-full mt-8">
        <div class="flex w-[65vw] justify-between space-x-8">
            <div class="flex-1 occurance-container">
                <AddCard on:cardAdded={refreshCards}/>
            </div>
            <div class="flex-1 occurrence-container space-y-14 overflow-y-auto max-h-[90vh]"> 
                <SavingFor />
            </div>
            <div class="flex-[2] occurrence-container space-y-4 overflow-y-auto max-h-[90vh]">
                {#each userCards as card}
                    <Occurrance {card} />
                {/each}
            </div>
        </div>
    </div>
    <Database/>
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