<script lang="ts">
    import { beforeNavigate, goto } from "$app/navigation";
    import * as AlertDialog from "$lib/components/ui/alert-dialog/index";
    import * as Tooltip from "$lib/components/ui/tooltip/index";
    import PayScheduleSection from "$lib/components/settings/PayScheduleSection.svelte";
    import RecurringBillsSection from "$lib/components/settings/RecurringBillsSection.svelte";
    import { Button } from "$lib/components/ui/button/index";
    import { tour } from "$lib/tour/tour.svelte";
    import { samplePaySchedule, sampleRecurringBills } from "$lib/tour/sample-data";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    // While the intro tour runs, a section the user hasn't filled in yet shows
    // example data instead (never saved; the page is inert for as long as it's up).
    let paydaySettings = $derived(data.paydaySettings ?? (tour.active ? samplePaySchedule() : undefined));
    let recurringBills = $derived(
        tour.active && data.recurringBills.length === 0 ? sampleRecurringBills() : data.recurringBills
    );

    let payDirty = $state(false);
    let billsDirty = $state(false);
    let takeHome = $state("");

    let leaveOpen = $state(false);
    let pendingUrl = $state<URL | null>(null);
    let leaving = false;

    // Leaving with unsaved edits: in-app links are held while the dialog asks;
    // closing the tab or reloading gets the browser's own "leave site?" prompt.
    beforeNavigate((navigation) => {
        if (leaving || (!payDirty && !billsDirty)) {
            return;
        }
        navigation.cancel();
        if (navigation.type !== "leave" && navigation.to) {
            pendingUrl = navigation.to.url;
            leaveOpen = true;
        }
    });

    function leaveAnyway() {
        if (!pendingUrl) {
            return;
        }
        leaving = true;
        leaveOpen = false;
        // pendingUrl came from a link the user clicked inside the app, so it's already a resolved route.
        // eslint-disable-next-line svelte/no-navigation-without-resolve
        goto(pendingUrl);
    }
</script>

<svelte:head><title>Settings · TakeHome Tracker</title></svelte:head>

<Tooltip.Provider>
    <div class="flex justify-center px-8 py-8" inert={tour.active}>
        <div class="flex w-full max-w-[900px] flex-col gap-6">
            <div class="flex items-center justify-between gap-2">
                <h1 class="text-2xl font-semibold">Settings</h1>
                <Button type="button" variant="outline" onclick={() => tour.start()}>Replay tour</Button>
            </div>

            <!-- The sections copy their data once when created, so they're rebuilt when
                 the tour starts or ends to swap the example data in and back out. -->
            {#key tour.active}
                <PayScheduleSection {paydaySettings} bind:dirty={payDirty} bind:takeHome />
                <RecurringBillsSection {recurringBills} {takeHome} bind:dirty={billsDirty} />
            {/key}
        </div>
    </div>
</Tooltip.Provider>

<AlertDialog.Root bind:open={leaveOpen}>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>Leave without saving?</AlertDialog.Title>
            <AlertDialog.Description>
                You have unsaved changes{payDirty && billsDirty
                    ? " to your pay schedule and recurring bills"
                    : payDirty
                      ? " to your pay schedule"
                      : " to your recurring bills"}. They'll be lost if you leave.
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Cancel>Stay</AlertDialog.Cancel>
            <AlertDialog.Action onclick={leaveAnyway}>Leave</AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>
