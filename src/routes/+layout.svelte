<script lang="ts">
    import 'driver.js/dist/driver.css';
    import './layout.css';
    import yahoo from '$lib/assets/yahoo.jpg';
    import Navbar from '$lib/components/Navbar.svelte';
    import { Button } from '$lib/components/ui/button/index';
    import { resolve } from '$app/paths';
    import { page } from '$app/state';
    import SettingsIcon from '@lucide/svelte/icons/settings';
    import LogOutIcon from '@lucide/svelte/icons/log-out';
    import { Toaster } from '$lib/components/ui/sonner/index';
    import { untrack } from 'svelte';
    import { tour } from '$lib/tour/tour.svelte';
    import type { LayoutData } from './$types';

    let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

    // The intro tour lives here so it survives moving between pages. This re-checks
    // on load and after each navigation whether it should start (or resume).
    $effect(() => {
        const user = data.user;
        const routeId = page.route.id;
        untrack(() => tour.sync(user, routeId));
    });
</script>

{#snippet loggedOutCorner()}
    <Button href={resolve('/login')}>
        Login
    </Button>
{/snippet}

{#snippet loggedInCorner()}
    {#if page.url.pathname === '/tracker'}
        <Button href={resolve('/settings')} variant="outline" size="icon" aria-label="Settings" data-tour="nav-settings">
            <SettingsIcon class="h-5 w-5" />
        </Button>
    {:else}
        <Button href={resolve('/tracker')} variant="outline" data-tour="nav-tracker">
            Tracker
        </Button>
    {/if}
    <form method="POST" action="/logout">
        <!-- Phones show just the icon so the navbar fits; sm and up shows the label. -->
        <Button type="submit" aria-label="Log out" class="px-3 sm:px-4">
            <LogOutIcon class="h-5 w-5 sm:hidden" />
            <span class="hidden sm:inline">Log out</span>
        </Button>
    </form>
{/snippet}

<svelte:head><link rel="icon" href={yahoo} /></svelte:head>

<Toaster richColors position="bottom-right" />

<!-- Navbar keeps its natural height; the content slot below gets exactly
     "one screen minus the navbar" via flex-1. h-dvh (not h-screen) so a phone
     browser's URL bar doesn't push the bottom of the page off screen. -->
<div class="flex h-dvh flex-col overflow-hidden">
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