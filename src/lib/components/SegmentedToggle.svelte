<script lang="ts" generics="T extends string">
    import { cn } from "$lib/utils.js";

    let {
        options,
        value = $bindable(),
        class: className = undefined
    }: {
        options: { value: T; label: string; ariaLabel?: string }[];
        value: T;
        class?: string;
    } = $props();
</script>

<div class={cn("flex shrink-0 overflow-hidden rounded-md border", className)}>
    {#each options as option, index (option.value)}
        <button
            type="button"
            class="px-2.5 py-1.5 text-sm font-semibold transition-colors"
            class:border-l={index > 0}
            class:bg-muted={value === option.value}
            class:text-foreground={value === option.value}
            class:text-muted-foreground={value !== option.value}
            class:hover:text-foreground={value !== option.value}
            aria-pressed={value === option.value}
            aria-label={option.ariaLabel ?? option.label}
            onclick={() => (value = option.value)}
        >
            {option.label}
        </button>
    {/each}
</div>
