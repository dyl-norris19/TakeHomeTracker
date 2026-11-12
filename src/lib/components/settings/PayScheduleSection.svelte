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
    import { toast } from "svelte-sonner";
    import CalendarIcon from "@lucide/svelte/icons/calendar";
    import { CalendarDate, type DateValue, getLocalTimeZone } from "@internationalized/date";
    import { cn } from "$lib/utils";
    import { paydatesInMonth } from "$lib/paydates";

    type Frequency = "weekly" | "biweekly" | "semimonthly" | "monthly";
    type WeekendRule = "before" | "after" | "none";

    type PaySchedule = {
        frequency: Frequency;
        anchor: string; // YYYY-MM-DD, weekly/biweekly only
        monthlyDay: string;
        semiDays: [string, string];
        weekendRule: WeekendRule;
        takeHome: string;
    };

    let {
        paydaySettings,
        dirty = $bindable(false),
        takeHome = $bindable("")
    }: {
        paydaySettings?: { paydate: Date; frequency: number };
        dirty?: boolean;
        // Bound up so the bills section can show what a % bill works out to.
        takeHome?: string;
    } = $props();

    const FREQUENCY_FROM_DB: Record<number, Frequency> = { 1: "monthly", 2: "biweekly", 4: "weekly" };

    function toIso(date: Date): string {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    }

    function initialSchedule(): PaySchedule {
        const paydate = paydaySettings?.paydate;
        return {
            frequency: paydaySettings ? (FREQUENCY_FROM_DB[paydaySettings.frequency] ?? "biweekly") : "biweekly",
            anchor: paydate ? toIso(paydate) : "",
            monthlyDay: paydate ? String(paydate.getDate()) : "1",
            semiDays: ["1", "15"],
            weekendRule: "before",
            takeHome: ""
        };
    }

    let saved = $state<PaySchedule>(initialSchedule());
    let form = $state<PaySchedule>(initialSchedule());
    let saving = $state(false);
    let popoverOpen = $state(false);

    $effect(() => {
        dirty = JSON.stringify(form) !== JSON.stringify(saved);
    });
    $effect(() => {
        takeHome = form.takeHome;
    });

    // The calendar wants a DateValue; the form keeps a plain ISO string so the
    // dirty check is a simple JSON compare.
    let anchorValue = $derived.by(() => {
        if (!form.anchor) {
            return undefined;
        }
        const [y, m, d] = form.anchor.split("-").map(Number);
        return new CalendarDate(y, m, d);
    });
    function onAnchorPick(value: DateValue | undefined) {
        form.anchor = value ? toIso(value.toDate(getLocalTimeZone())) : "";
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

    function shiftForWeekend(date: Date, rule: WeekendRule): Date {
        const day = date.getDay();
        if (rule === "none" || (day !== 0 && day !== 6)) {
            return date;
        }
        // Saturday → Fri (-1) / Mon (+2); Sunday → Fri (-2) / Mon (+1).
        const shift = rule === "before" ? (day === 6 ? -1 : -2) : (day === 6 ? 2 : 1);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate() + shift);
    }

    // Prototype preview: the real version would live in $lib/paydates.ts.
    let upcoming = $derived.by(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dates: Date[] = [];

        for (let offset = 0; offset <= 2; offset++) {
            const base = new Date(today.getFullYear(), today.getMonth() + offset, 1);
            const year = base.getFullYear();
            const monthIndex = base.getMonth();
            const last = new Date(year, monthIndex + 1, 0).getDate();

            if (form.frequency === "weekly" || form.frequency === "biweekly") {
                if (!form.anchor) {
                    return [];
                }
                const [y, m, d] = form.anchor.split("-").map(Number);
                dates.push(
                    ...paydatesInMonth(
                        { paydate: new Date(y, m - 1, d), frequency: form.frequency === "weekly" ? 4 : 2 },
                        year,
                        monthIndex
                    )
                );
            } else {
                const days = form.frequency === "monthly" ? [form.monthlyDay] : form.semiDays;
                for (const day of days.map(Number).sort((a, b) => a - b)) {
                    dates.push(shiftForWeekend(new Date(year, monthIndex, Math.min(day, last)), form.weekendRule));
                }
            }
        }

        return dates.filter((date) => date >= today).slice(0, 4);
    });

    let error = $derived.by(() => {
        if ((form.frequency === "weekly" || form.frequency === "biweekly") && !form.anchor) {
            return "Pick a recent payday.";
        }
        if (form.frequency === "semimonthly" && form.semiDays[0] === form.semiDays[1]) {
            return "Pick two different days.";
        }
        return "";
    });

    // Prototype: fakes the round trip so the spinner and toast can be seen.
    function save() {
        saving = true;
        setTimeout(() => {
            saved = structuredClone($state.snapshot(form));
            saving = false;
            toast.success("Pay schedule saved");
        }, 800);
    }

    function discard() {
        form = structuredClone($state.snapshot(saved));
    }
</script>

<Card.Root>
    <Card.Header>
        <Card.Title>Pay schedule</Card.Title>
        <Card.Description>When you get paid and what a normal paycheck is. New cards are dated and prefilled from this.</Card.Description>
    </Card.Header>
    <Card.Content class="grid gap-6">
        <div class="grid gap-2">
            <Label>How often are you paid?</Label>
            <!-- Clicking the selected item would clear a single toggle group; ignore that so a choice is always set. -->
            <ToggleGroup.Root
                type="single"
                variant="outline"
                class="w-fit justify-start"
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
                            "w-[240px] justify-start text-left font-normal",
                            !form.anchor && "text-muted-foreground"
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
                        <Select.Root type="single" bind:value={form.monthlyDay}>
                            <Select.Trigger class="w-[180px]">{dayLabel(form.monthlyDay)}</Select.Trigger>
                            <Select.Content>
                                {#each dayOptions as day (day)}
                                    <Select.Item value={day} label={dayLabel(day)}>{dayLabel(day)}</Select.Item>
                                {/each}
                            </Select.Content>
                        </Select.Root>
                    {:else}
                        {#each [0, 1] as slot (slot)}
                            {#if slot === 1}<span class="text-muted-foreground text-sm">and</span>{/if}
                            <Select.Root type="single" bind:value={form.semiDays[slot]}>
                                <Select.Trigger class="w-[180px]">{dayLabel(form.semiDays[slot])}</Select.Trigger>
                                <Select.Content>
                                    {#each dayOptions as day (day)}
                                        <Select.Item value={day} label={dayLabel(day)}>{dayLabel(day)}</Select.Item>
                                    {/each}
                                </Select.Content>
                            </Select.Root>
                        {/each}
                    {/if}
                </div>
            </div>
            <div class="grid gap-2">
                <Label>If payday lands on a weekend</Label>
                <ToggleGroup.Root
                    type="single"
                    variant="outline"
                    class="w-fit justify-start"
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
            <div class="relative w-[180px]">
                <span class="text-muted-foreground pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm">$</span>
                <Input id="take-home" class="pl-6" placeholder="0.00" bind:value={form.takeHome} />
            </div>
            <p class="text-muted-foreground text-xs">Fills in the paycheck amount on new cards. You can still change it on each card. Post tax and benefit deductions.</p>
        </div>

        <div class="bg-muted/50 rounded-md border p-3">
            <p class="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">Your next paydays</p>
            {#if upcoming.length > 0}
                <div class="flex flex-wrap gap-2">
                    {#each upcoming as date (date.getTime())}
                        <Badge variant="outline" class="bg-background text-sm font-normal">{dateFmt.format(date)}</Badge>
                    {/each}
                </div>
            {:else}
                <p class="text-muted-foreground text-sm">Pick a payday to see a preview.</p>
            {/if}
        </div>
    </Card.Content>
    <Card.Footer class="border-t pt-4">
        <SaveBar {dirty} {saving} error={dirty ? error : ""} disabled={!!error} onsave={save} ondiscard={discard} />
    </Card.Footer>
</Card.Root>
