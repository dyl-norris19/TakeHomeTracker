<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import Moon from "@lucide/svelte/icons/moon";
    import Sun from "@lucide/svelte/icons/sun";
    import { onMount } from "svelte";
    import { resolve } from "$app/paths";
    import type { Snippet } from "svelte";

    let { children }: { children?: Snippet } = $props();

    let theme = $state("light");
    // let { login } = $props();

    function toggleTheme() {
        theme = theme === "light" ? "dark" : "light";
        document.documentElement.classList.toggle("dark", theme === "dark");
        localStorage.setItem("theme", theme);
    }

    onMount(() => {
        theme = localStorage.getItem("theme") || "light";
        document.documentElement.classList.toggle("dark", theme === "dark");
    });
</script>

<header class="w-full border-b shadow-sm dark:border-neutral-800">
    <div class="container mx-auto flex h-16 items-center justify-between px-4">
        <div class="flex items-center gap-10">
            <Button
                variant="outline"
                size="icon"
                onclick={toggleTheme}
                aria-label="Toggle theme"
            >
                {#if theme === "light"}
                    <Sun class="h-5 w-5" />
                {:else}
                    <Moon class="h-5 w-5" />
                {/if}
            </Button>

            <!-- <a class="text-foreground hover:text-foreground transition-colors">
                <Link to="login">
                    About
                </Link>
            </a> -->
        </div>

        <!-- Middle: Logo -->
        <a href={resolve('/')} class="text-xl font-semibold">
            TakeHome Tracker
        </a>

        <!-- Right: Theme Toggle & Login -->
        <div class="flex items-center gap-2">
            {@render children?.()}
        </div>
    </div>
</header>
