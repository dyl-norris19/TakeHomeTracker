<script lang="ts">
    import { Button } from "$lib/components/ui/button/index";
    import LoaderCircle from "@lucide/svelte/icons/loader-circle";

    let {
        dirty,
        saving,
        error = "",
        disabled = false,
        onsave,
        ondiscard
    }: {
        dirty: boolean;
        saving: boolean;
        error?: string;
        disabled?: boolean;
        onsave: () => void;
        ondiscard: () => void;
    } = $props();
</script>

<!-- Section footer: validation message on the left, Discard/Save on the right.
     Save results are announced with a toast, not here. -->
<div class="flex w-full items-center justify-between gap-4">
    <p class="text-sm text-red-500" aria-live="polite">{error}</p>
    <div class="flex gap-2">
        <Button type="button" variant="ghost" disabled={!dirty || saving} onclick={ondiscard}>
            Discard
        </Button>
        <Button type="button" disabled={!dirty || disabled || saving} onclick={onsave}>
            {#if saving}
                <LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
            {/if}
            Save
        </Button>
    </div>
</div>
