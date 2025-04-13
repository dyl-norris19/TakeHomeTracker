<script lang="ts">
    import Navbar from '$lib/svelteComponents/Navbar.svelte'
    import Occurrance from '$lib/svelteComponents/Occurrance.svelte'
    import SavingFor from '$lib/svelteComponents/SavingFor.svelte'
    import Database from '$lib/svelteComponents/testDatabase.svelte'
    import AddCard from '$lib/svelteComponents/AddCard.svelte'
    import 'normalize.css';
  </script>
  
  <div>
    <Navbar />
    <div class="flex justify-center w-full mt-8">
        <div class="flex w-[65vw] justify-between space-x-8">
            <div class="flex-1 occurance-container">
                <AddCard />
            </div>
            <div class="flex-1 occurrence-container space-y-14 overflow-y-auto max-h-[90vh]"> 
                <SavingFor />
                <SavingFor />
                <SavingFor />
                <SavingFor />
                <SavingFor />
                <SavingFor />
                <SavingFor />
            </div>
            <div class="flex-[2] occurrence-container space-y-4 overflow-y-auto max-h-[90vh]">
                <Occurrance />
                <Occurrance />
                <Occurrance />
                <Occurrance />
                <Occurrance />
                <Occurrance />
                <Occurrance />
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