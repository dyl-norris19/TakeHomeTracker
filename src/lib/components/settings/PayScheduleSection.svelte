<script lang="ts">
    import * as Card from "$lib/components/ui/card/index";
    import * as Select from "$lib/components/ui/select/index";
    import * as Popover from "$lib/components/ui/popover/index";
    import { Calendar } from "$lib/components/ui/calendar/index";
    import { Input } from "$lib/components/ui/input/index";
    import { Label } from "$lib/components/ui/label/index";
    import { buttonVariants } from "$lib/components/ui/button/index";
    import * as ToggleGroup from "$lib/components/ui/toggle-group/index";
    import { Badge } from "$lib/components/ui/badge/index";
    import SaveBar from "$lib/components/settings/SaveBar.svelte";
    import { enhance } from "$app/forms";
    import { toast } from "svelte-sonner";
    import CalendarIcon from "@lucide/svelte/icons/calendar";
    import { CalendarDate, type DateValue, getLocalTimeZone } from "@internationalized/date";
    import { cn } from "$lib/utils";
    import {
        toIsoDate,
        upcomingPaydates,
        type Frequency,
        type PaydaySettings,
        type WeekendRule
    } from "$lib/paydates";
    import { validatePaySchedule, type PayScheduleValues } from "$lib/validation";
    import { centsToInput, parseToCents } from "$lib/money";

    // Everything is kept as strings (what the inputs hold) so the dirty check is
    // a plain JSON compare; currentValues() converts for validation and preview.
    type PayScheduleForm = {
        frequency: Frequency;
        anchorDate: string; // YYYY-MM-DD, weekly/biweekly only
        payDay1: string;
        payDay2: string;
        weekendRule: WeekendRule;
        takeHome: string;
    };

    let {
        paydaySettings,
        dirty = $bindable(false),
        takeHome = $bindable("")
    }: {
        paydaySettings?: PaydaySettings & { takeHomeCents: number | null };
        dirty?: boolean;
        // Bound up so the bills section can show what a % bill works out to.
        takeHome?: string;
    } = $props();

    function initialSchedule(): PayScheduleForm {
        return {
            frequency: paydaySettings?.frequency ?? "biweekly",
            anchorDate: paydaySettings?.anchorDate ?? "",
            payDay1: String(paydaySettings?.payDay1 ?? 1),
            payDay2: String(paydaySettings?.payDay2 ?? 15),
            weekendRule: paydaySettings?.weekendRule ?? "before",
            takeHome: paydaySettings?.takeHomeCents != null ? centsToInput(paydaySettings.takeHomeCents) : ""
        };
    }

    let saved = $state<PayScheduleForm>(initialSchedule());
    let form = $state<PayScheduleForm>(initialSchedule());
    let saving = $state(false);
    let serverError = $state("");
    let popoverOpen = $state(false);

    $effect(() => {
        dirty = JSON.stringify(form) !== JSON.stringify(saved);
    });
    $effect(() => {
        takeHome = form.takeHome;
    });

    // The calendar wants a DateValue; the form keeps a plain ISO string.
    let anchorValue = $derived.by(() => {
        if (!form.anchorDate) {
            return undefined;
        }
        const [y, m, d] = form.anchorDate.split("-").map(Number);
        return new CalendarDate(y, m, d);
    });
    // Only a real pick updates the date and closes the popover. The calendar
    // writes `undefined` back through this setter when it mounts with no date
    // (and when the selected day is clicked again), which used to close the
    // popover the instant it opened.
    function onAnchorPick(value: DateValue | undefined) {
        if (!value) {
            return;
        }
        form.anchorDate = toIsoDate(value.toDate(getLocalTimeZone()));
        popoverOpen = false;
    }

    const dateFmt = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" });
    const longFmt = new Intl.DateTimeFormat("en-US", { dateStyle: "long" });

    const dayOptions = Array.from({ length: 31 }, (_, i) => String(i + 1));
    function dayLabel(day: string): string {
        const n = Number(day);
        const suffix = n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th";
        return n >= 29 ? `${n}${suffix} (or last day)` : `${n}${suffix}`;
    }

    function currentValues(): PayScheduleValues {
        const rawTakeHome = form.takeHome.trim();
        return {
            frequency: form.frequency,
            anchorDate: form.anchorDate || null,
            payDay1: Number(form.payDay1),
            payDay2: Number(form.payDay2),
            weekendRule: form.weekendRule,
            takeHomeCents: rawTakeHome ? parseToCents(rawTakeHome) : null
        };
    }

    let upcoming = $derived(
        upcomingPaydates({
            frequency: form.frequency,
            anchorDate: form.anchorDate || null,
            payDay1: Number(form.payDay1),
            payDay2: Number(form.payDay2),
            weekendRule: form.weekendRule
        })
    );

    let error = $derived(validatePaySchedule(currentValues()) ?? "");

    function discard() {
        form = structuredClone($state.snapshot(saved));
        serverError = "";
    }
</script>

<form
    method="POST"
    action="?/updatePaySchedule"
    use:enhance={({ cancel }) => {
        if (error) {
            toast.error(error);
            cancel();
            return;
        }
        saving = true;
        serverError = "";
        const submitted = $state.snapshot(form);
        return async ({ result, update }) => {
            saving = false;
            if (result.type === "success") {
                saved = structuredClone(submitted);
                toast.success("Pay schedule saved");
                await update({ reset: false });
            } else if (result.type === "failure") {
                const data = result.data as { payScheduleError?: string } | undefined;
                serverError = data?.payScheduleError ?? "Couldn’t save — try again.";
                toast.error(serverError);
            } else {
                toast.error("Something went wrong — try again.");
                await update({ reset: false });
            }
        };
    }}
>
    <input type="hidden" name="frequency" value={form.frequency} />
    <input type="hidden" name="anchorDate" value={form.anchorDate} />
    <input type="hidden" name="payDay1" value={form.payDay1} />
    <input type="hidden" name="payDay2" value={form.payDay2} />
    <input type="hidden" name="weekendRule" value={form.weekendRule} />

    <Card.Root data-tour="pay-schedule">
        <Card.Header>
            <Card.Title>Pay schedule</Card.Title>
            <Card.Description>When you get paid and what a normal paycheck is. New cards are dated and prefilled from this.</Card.Description>
        </Card.Header>
        <Card.Content class="grid gap-6">
            <div class="grid gap-2">
                <Label>How often are you paid?</Label>
                <!-- Clicking the selected item would clear a single toggle group; ignore that so a choice is always set. -->
                <!-- Phones: a 2x2 grid, since the four options don't fit on one line. -->
                <ToggleGroup.Root
                    type="single"
                    variant="outline"
                    class="grid w-full grid-cols-2 sm:flex sm:w-fit sm:justify-start"
                    bind:value={() => form.frequency, (v) => v && (form.frequency = v as Frequency)}
                >
                    <ToggleGroup.Item value="weekly">Weekly</ToggleGroup.Item>
                    <ToggleGroup.Item value="biweekly">Biweekly</ToggleGroup.Item>
                    <ToggleGroup.Item value="semimonthly">Semimonthly</ToggleGroup.Item>
                    <ToggleGroup.Item value="monthly">Monthly</ToggleGroup.Item>
                </ToggleGroup.Root>
            </div>

            {#if form.frequency === "weekly" || form.frequency === "biweekly"}
                <div class="grid gap-2">
                    <Label>A recent payday</Label>
                    <Popover.Root bind:open={popoverOpen}>
                        <Popover.Trigger
                            type="button"
                            class={cn(
                                buttonVariants({ variant: "outline" }),
                                "w-full justify-start text-left font-normal sm:w-[240px]",
                                !form.anchorDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon class="mr-2 h-4 w-4" />
                            {anchorValue ? longFmt.format(anchorValue.toDate(getLocalTimeZone())) : "Pick a date"}
                        </Popover.Trigger>
                        <Popover.Content class="w-auto p-0" align="start">
                            <Calendar type="single" bind:value={() => anchorValue, onAnchorPick} />
                        </Popover.Content>
                    </Popover.Root>
                </div>
            {:else}
                <div class="grid gap-2">
                    <Label>{form.frequency === "monthly" ? "Day of the month" : "Days of the month"}</Label>
                    <div class="flex items-center gap-2">
                        {#if form.frequency === "monthly"}
                            <Select.Root type="single" bind:value={form.payDay1}>
                                <Select.Trigger class="min-w-0 flex-1 sm:w-[180px] sm:flex-none">{dayLabel(form.payDay1)}</Select.Trigger>
                                <Select.Content>
                                    {#each dayOptions as day (day)}
                                        <Select.Item value={day} label={dayLabel(day)}>{dayLabel(day)}</Select.Item>
                                    {/each}
                                </Select.Content>
                            </Select.Root>
                        {:else}
                            <Select.Root type="single" bind:value={form.payDay1}>
                                <Select.Trigger class="min-w-0 flex-1 sm:w-[180px] sm:flex-none">{dayLabel(form.payDay1)}</Select.Trigger>
                                <Select.Content>
                                    {#each dayOptions as day (day)}
                                        <Select.Item value={day} label={dayLabel(day)}>{dayLabel(day)}</Select.Item>
                                    {/each}
                                </Select.Content>
                            </Select.Root>
                            <span class="text-muted-foreground text-sm">and</span>
                            <Select.Root type="single" bind:value={form.payDay2}>
                                <Select.Trigger class="min-w-0 flex-1 sm:w-[180px] sm:flex-none">{dayLabel(form.payDay2)}</Select.Trigger>
                                <Select.Content>
                                    {#each dayOptions as day (day)}
                                        <Select.Item value={day} label={dayLabel(day)}>{dayLabel(day)}</Select.Item>
                                    {/each}
                                </Select.Content>
                            </Select.Root>
                        {/if}
                    </div>
                </div>
                <div class="grid gap-2">
                    <Label>If payday lands on a weekend</Label>
                    <!-- Phones: stacked, one option per line. -->
                    <ToggleGroup.Root
                        type="single"
                        variant="outline"
                        class="grid w-full grid-cols-1 sm:flex sm:w-fit sm:justify-start"
                        bind:value={() => form.weekendRule, (v) => v && (form.weekendRule = v as WeekendRule)}
                    >
                        <ToggleGroup.Item value="before">Paid the Friday before</ToggleGroup.Item>
                        <ToggleGroup.Item value="after">Paid the Monday after</ToggleGroup.Item>
                        <ToggleGroup.Item value="none">Same day</ToggleGroup.Item>
                    </ToggleGroup.Root>
                </div>
            {/if}

            <div class="grid gap-2">
                <Label for="take-home">Salary <span class="text-muted-foreground font-normal">(optional)</span></Label>
                <div class="relative w-full sm:w-[180px]">
                    <span class="text-muted-foreground pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm">$</span>
                    <Input id="take-home" name="takeHome" class="pl-6" placeholder="0.00" bind:value={form.takeHome} />
                </div>
                <p class="text-muted-foreground text-xs">Fills in the paycheck amount on new cards. You can still change it on each card. Post tax and benefit deductions.</p>
            </div>

            <div class="bg-muted/50 rounded-md border p-3">
                <p class="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">Your next paydays</p>
                {#if upcoming.length > 0}
                    <div class="flex flex-wrap gap-2">
                        <!-- Index key: two paydays can share a date (e.g. the 14th and 15th both moved to Friday). -->
                        {#each upcoming as date, i (i)}
                            <Badge variant="outline" class="bg-background text-sm font-normal">{dateFmt.format(date)}</Badge>
                        {/each}
                    </div>
                {:else}
                    <p class="text-muted-foreground text-sm">Pick a payday to see a preview.</p>
                {/if}
            </div>
        </Card.Content>
        <Card.Footer class="border-t pt-4">
            <SaveBar {dirty} {saving} error={dirty ? error || serverError : ""} disabled={!!error} ondiscard={discard} />
        </Card.Footer>
    </Card.Root>
</form>
