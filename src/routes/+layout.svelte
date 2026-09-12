<script lang="ts">
    import './layout.css';
    import yahoo from '$lib/assets/yahoo.jpg';
    import Navbar from '$lib/components/Navbar.svelte';
    import { Button } from '$lib/components/ui/button/index';
    import { resolve } from '$app/paths';
    import type { LayoutData } from './$types';

    let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();
</script>

{#snippet loggedOutCorner()}
    <Button href={resolve('/login')}>
        Login
    </Button>
{/snippet}

{#snippet loggedInCorner()}
    <Button href={resolve('/tracker')} variant="outline">
        Tracker
    </Button>
    <form method="POST" action="/logout">
        <Button type="submit">
            Log out
        </Button>
    </form>
{/snippet}

<svelte:head><link rel="icon" href={yahoo} /></svelte:head>

<!-- Navbar keeps its natural height; the content slot below gets exactly
     "one screen minus the navbar" via flex-1 -->
<div class="flex h-screen flex-col overflow-hidden">
    <Navbar>
        {#if data.user}
            {@render loggedInCorner()}
        {:else}
            {@render loggedOutCorner()}
        {/if}
    </Navbar>
    <div class="min-h-0 flex-1 overflow-y-auto">
        {@render children()}
    </div>
</div>