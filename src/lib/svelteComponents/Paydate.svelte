<script lang="ts">

    import { Button } from "$lib/components/ui/button/index";
    import * as Dialog from "$lib/components/ui/dialog/index";
    import * as RadioGroup from "$lib/components/ui/radio-group/index";
    import { Label } from "$lib/components/ui/label/index";
    import CalendarIcon from "@lucide/svelte/icons/calendar";
    import {
        DateFormatter,
        type DateValue,
        getLocalTimeZone
    } from "@internationalized/date";
    import { cn } from "$lib/utils.js";
    import { buttonVariants } from "$lib/components/ui/button/index.js";
    import { Calendar } from "$lib/components/ui/calendar/index.js";
    import * as Popover from "$lib/components/ui/popover/index.js";

    import { updatePaydate } from "$lib/database/database";

    const df = new DateFormatter("en-US", {
        dateStyle: "long"
    });
    
    let value = $state<DateValue | undefined>();
    // let contentRef = $state<HTMLElement | null>(null);

    let paydayFrequency = $state<string>("");
    let { email }: { email: string} = $props();
    let cardOpen = $state<boolean>(false);
    let popoverOpen = $state<boolean>(false);

    function handleClick() {
        popoverOpen = false;
    }

    async function handleSubmit(email: string) {
        const jsDate = value?.toDate(getLocalTimeZone());
        const timestamp = jsDate?.getTime();
        
        try {
            const formData = {
                email: email,
                timestamp: timestamp,
                frequency: +paydayFrequency
            }

            cardOpen = false;

            await updatePaydate(formData);
        } catch (err) {
            console.error("Error: ", err);
        }
    }
</script>

<Dialog.Root bind:open={cardOpen}>
    <Dialog.Trigger>
        <Button variant="outline">Paydate</Button>
    </Dialog.Trigger>
    <Dialog.Content>
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
        <Dialog.Footer>
            <Button onclick={() => {handleSubmit(email)}}>Submit</Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>