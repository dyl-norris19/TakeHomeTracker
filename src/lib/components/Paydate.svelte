<script lang="ts">

    import { Button } from "$lib/components/ui/button/index";
    import * as Dialog from "$lib/components/ui/dialog/index";
    import * as RadioGroup from "$lib/components/ui/radio-group/index";
    import { Label } from "$lib/components/ui/label/index";
    import CalendarIcon from "@lucide/svelte/icons/calendar";
    import {
        CalendarDate,
        DateFormatter,
        type DateValue,
        getLocalTimeZone
    } from "@internationalized/date";
    import { cn } from "$lib/utils.js";
    import { buttonVariants } from "$lib/components/ui/button/index.js";
    import { Calendar } from "$lib/components/ui/calendar/index.js";
    import * as Popover from "$lib/components/ui/popover/index.js";
    import { enhance } from "$app/forms";

    let { paydaySettings }: { paydaySettings?: { paydate: Date; frequency: number } } = $props();

    const df = new DateFormatter("en-US", {
        dateStyle: "long"
    });

    function toCalendarDate(date: Date): DateValue {
        return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
    }

    let value = $state<DateValue | undefined>(
        paydaySettings ? toCalendarDate(paydaySettings.paydate) : undefined
    );
    let paydayFrequency = $state<string>(paydaySettings ? String(paydaySettings.frequency) : "");
    let paydateTimestamp = $derived(value ? Math.floor(value.toDate(getLocalTimeZone()).getTime() / 1000) : "");

    let cardOpen = $state<boolean>(false);
    let popoverOpen = $state<boolean>(false);

    function handleClick() {
        // popoverOpen = false;
    }
</script>

<Dialog.Root bind:open={cardOpen}>
    <Dialog.Trigger>
        <Button variant="outline">Paydate</Button>
    </Dialog.Trigger>
    <Dialog.Content>
        <form
            method="POST"
            action="?/updatePaydate"
            use:enhance={() => {
                return async ({ result, update }) => {
                    await update({ reset: false });
                    if (result.type === 'success') {
                        cardOpen = false;
                    }
                };
            }}
        >
            <Dialog.Header>
                <Dialog.Title>Paydate</Dialog.Title>
                <Dialog.Description>Set your paydate. Make sure it is before any cards</Dialog.Description>
            </Dialog.Header>
            <Popover.Root bind:open={popoverOpen}>
                <Popover.Trigger asChild let:builder>
                    <Button
                    variant="outline"
                    class={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !value && "text-muted-foreground"
                    )}
                    builders={[builder]}>
                        <CalendarIcon class="mr-2 h-4 w-4" />
                        {value ? df.format(value.toDate(getLocalTimeZone())) : "Pick a date"}
                    </Button>
                </Popover.Trigger>
                <Popover.Content class="w-auto p-0" align="start">
                    <Calendar bind:value onclick={handleClick}/>
                </Popover.Content>
            </Popover.Root>
            <RadioGroup.Root bind:value={paydayFrequency}>
                <div class="flex space-x-4">
                    <div class="flex items-center space-x-2">
                        <RadioGroup.Item value={"1"} id="r1" />
                        <Label for="r1">Monthly</Label>
                    </div>
                    <div class="flex items-center space-x-2">
                        <RadioGroup.Item value="2" id="r2" />
                        <Label for="r2">Every Other Week</Label>
                    </div>
                    <div class="flex items-center space-x-2">
                        <RadioGroup.Item value="4" id="r3" />
                        <Label for="r3">Weekly</Label>
                    </div>
                </div>
            </RadioGroup.Root>
            <input type="hidden" name="paydate" value={paydateTimestamp} />
            <input type="hidden" name="frequency" value={paydayFrequency} />
            <Dialog.Footer>
                <Button type="submit">Submit</Button>
            </Dialog.Footer>
        </form>
    </Dialog.Content>
</Dialog.Root>
