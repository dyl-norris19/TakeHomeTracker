<script lang="ts">
    import { beforeNavigate, goto } from "$app/navigation";
    import * as AlertDialog from "$lib/components/ui/alert-dialog/index";
    import * as Tooltip from "$lib/components/ui/tooltip/index";
    import PayScheduleSection from "$lib/components/settings/PayScheduleSection.svelte";
    import RecurringBillsSection from "$lib/components/settings/RecurringBillsSection.svelte";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

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
    <div class="flex justify-center px-8 py-8">
        <div class="flex w-full max-w-[900px] flex-col gap-6">
            <div class="flex flex-col gap-2">
                <h1 class="text-2xl font-semibold">Settings</h1>
            </div>

            <PayScheduleSection paydaySettings={data.paydaySettings} bind:dirty={payDirty} bind:takeHome />
            <RecurringBillsSection recurringBills={data.recurringBills} {takeHome} bind:dirty={billsDirty} />
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
