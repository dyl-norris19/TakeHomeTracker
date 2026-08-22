<script lang="ts">
    import './layout.css';
    import favicon from '$lib/assets/favicon.svg';
    import Navbar from '$lib/svelteComponents/Navbar.svelte';
    import { Button } from '$lib/components/ui/button/index';
    import { getTopRight } from '$lib/state/nav.svelte';

    let { children } = $props();
</script>

{#snippet bruh1()}
    <Button href="/login">
        Login
    </Button>
{/snippet}

{#snippet bruh2()}
    <form method="POST" action="/logout">
        <Button type="submit">
            Log out
        </Button>
    </form>
{/snippet}

{#snippet bruh3()}
    <Button>
        (idk what this needs to be)
    </Button>
{/snippet}

{#snippet trCorner()}
    {#if getTopRight() === "login"}
        <Navbar>{@render bruh1()}</Navbar>
    {:else if getTopRight() === "logged"}
        <Navbar>{@render bruh2()}</Navbar>
    {:else if getTopRight() === "logging"}
        <Navbar>{@render bruh3()}</Navbar>
    {:else}
        <Navbar>{@render bruh1()}</Navbar>
    {/if}
{/snippet}

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{@render trCorner()}
{@render children()}