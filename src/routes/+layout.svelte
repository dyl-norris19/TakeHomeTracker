<script lang="ts">
    import './layout.css';
    import favicon from '$lib/assets/favicon.svg';
    import Navbar from '$lib/svelteComponents/Navbar.svelte';
    import { Button } from '$lib/components/ui/button/index';
    import type { LayoutData } from './$types';

    let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();
</script>

{#snippet loggedOutCorner()}
    <Button href="/login">
        Login
    </Button>
{/snippet}

{#snippet loggedInCorner()}
    <Button href="/tracker" variant="outline">
        Tracker
    </Button>
    <form method="POST" action="/logout">
        <Button type="submit">
            Log out
        </Button>
    </form>
{/snippet}

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<Navbar>
    {#if data.user}
        {@render loggedInCorner()}
    {:else}
        {@render loggedOutCorner()}
    {/if}
</Navbar>
{@render children()}