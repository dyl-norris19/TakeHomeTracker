<script lang="ts">
    import PayScheduleSection from "$lib/components/settings/PayScheduleSection.svelte";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Settings · TakeHome Tracker</title></svelte:head>

<div class="flex justify-center px-8 py-8">
    <div class="flex w-full max-w-[900px] flex-col gap-6">
        <div class="flex flex-col gap-2">
            <h1 class="text-2xl font-semibold">Settings</h1>
        </div>

        <PayScheduleSection paydaySettings={data.paydaySettings} />
    </div>
</div>