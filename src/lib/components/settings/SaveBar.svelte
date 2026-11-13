<script lang="ts">
    import { Button } from "$lib/components/ui/button/index";
    import LoaderCircle from "@lucide/svelte/icons/loader-circle";

    let {
        dirty,
        saving,
        error = "",
        disabled = false,
        ondiscard
    }: {
        dirty: boolean;
        saving: boolean;
        error?: string;
        disabled?: boolean;
        ondiscard: () => void;
    } = $props();
</script>

<!-- Section footer: validation message on the left, Discard/Save on the right.
     Save submits the surrounding <form>; results are announced with a toast. -->
<!-- flex-wrap + mr-auto: on a phone a long message takes its own line and the
     buttons drop underneath, still on the right. -->
<div class="flex w-full flex-wrap items-center justify-end gap-x-4 gap-y-2">
    <p class="mr-auto text-sm text-red-500" aria-live="polite">{error}</p>
    <div class="flex shrink-0 gap-2">
        <Button type="button" variant="ghost" disabled={!dirty || saving} onclick={ondiscard}>
            Discard
        </Button>
        <Button type="submit" disabled={!dirty || disabled || saving}>
            {#if saving}
                <LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
            {/if}
            Save
        </Button>
    </div>
</div>
