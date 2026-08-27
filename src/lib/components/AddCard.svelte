<script lang="ts">
    import { Button } from "$lib/components/ui/button/index";
    import * as Select from "$lib/components/ui/select/index";
    import { Input } from "$lib/components/ui/input/index";
    import { Label } from "$lib/components/ui/label/index";
    import * as RadioGroup from "$lib/components/ui/radio-group/index.js";
    import * as Dialog from "$lib/components/ui/dialog/index";
    import { enhance } from "$app/forms";

    let { recurringBills }: { recurringBills: { name: string; amount: number }[] } = $props();

    type Month = {
        value: string;
        label: string;
    };

    const months: Month[] = [
        { value: "January", label: "January" },
        { value: "February", label: "February"},
        { value: "March", label: "March" },
        { value: "April", label: "April" },
        { value: "May", label: "May" },
        { value: "June", label: "June" },
        { value: "July", label: "July" },
        { value: "August", label: "August" },
        { value: "September", label: "September" },
        { value: "October", label: "October" },
        { value: "November", label: "November" },
        { value: "December", label: "December" },
    ];

    let selectedMonthObj = $state<Month>({ value: "", label: "" });
    let payAmount = $state<string | number>("");
    let savingsType = $state<string>("");
    let savingsAmount = $state<string | number>("");
    let reoccurBills = $state<{ name: string; amount: string | number }[]>([]);
    let otherBills = $state<{ name: string; amount: string | number }[]>([]);

    let cardOpen = $state<boolean>(false);

    $effect(() => {
        if (!cardOpen) {
            selectedMonthObj = { value: "", label: "" };
            payAmount = "";
            savingsType = "";
            savingsAmount = "";
            reoccurBills = recurringBills.map((bill) => ({ name: bill.name, amount: bill.amount }));
            otherBills = [];
        }
    });

    let reoccurBillsJson = $derived(
        JSON.stringify(reoccurBills.map((bill) => ({ name: bill.name, amount: Number(bill.amount) })))
    );
    let otherBillsJson = $derived(
        JSON.stringify(otherBills.map((bill) => ({ name: bill.name, amount: Number(bill.amount) })))
    );

    function addBillClick(): void {
        otherBills.push({ name: "", amount: "" });
    }

    function deleteBillClick(): void {
        otherBills.pop();
    }
</script>

<Dialog.Root bind:open={cardOpen}>
    <Dialog.Trigger asChild let:builder>
        <Button builders={[builder]}>New Card +</Button>
    </Dialog.Trigger>
    <Dialog.Content>
        <form
            method="POST"
            action="?/createCard"
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
                <Dialog.Title>New Paycheck!</Dialog.Title>
                <Dialog.Description>Fill out the info below</Dialog.Description>
            </Dialog.Header>
            <div class="grid gap-4 py-4">
                <h2 class="font-bold">Basics</h2>
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="month" class="text-right">Month</Label>
                    <Select.Root bind:selected={selectedMonthObj} portal={null}>
                        <Select.Trigger class="w-[180px]">
                            <Select.Value placeholder="Select a month" />
                        </Select.Trigger>
                        <Select.Content>
                            <Select.Group>
                                {#each months as month (month.value)}
                                    <Select.Item value={month.value} label={month.label}>
                                        {month.label}
                                    </Select.Item>
                                {/each}
                            </Select.Group>
                        </Select.Content>
                        <Select.Input name="month" />
                    </Select.Root>
                </div>
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="payAmt" class="text-right">Pay Amount ($)</Label>
                    <Input id="payAmt" placeholder="Enter Amount" bind:value={payAmount} class="col-span-3 w-[180px]"/>
                </div>
                <h2 class="font-bold">Reoccuring Bills</h2>
                <div class="grid grid-cols-4 items-center gap-4">
                    {#each reoccurBills as bill (bill)}
                        <Label class="text-right">{bill.name}</Label>
                        <Input class="col-span-3 w-[180px]" bind:value={bill.amount} />
                    {/each}
                </div>
                <h2 class="font-bold">Other Bills</h2>
                {#if otherBills.length > 0}
                    <Button type="button" class="w-[100px]" variant="destructive" onclick={deleteBillClick}>Delete Bill</Button>
                    <div class="grid grid-cols-5 items-center gap-4">
                        {#each otherBills as bill (bill)}
                            <Input placeholder="Bill Name" bind:value={bill.name} class="col-span-2"/>
                            <Input placeholder="Enter Amount" bind:value={bill.amount} class="col-span-2 w-[180px]" />
                        {/each}
                    </div>
                {:else}
                    <h2>(None)</h2>
                {/if}
                <h2 class="font-bold">Savings?</h2>
                <div class="flex space-x-5">
                    <RadioGroup.Root bind:value={savingsType}>
                        <div class="flex space-x-4">
                            <div class="flex items-center space-x-2">
                                <RadioGroup.Item value="%" id="r1" />
                                <Label for="r1">%</Label>
                            </div>
                            <div class="flex items-center space-x-2">
                                <RadioGroup.Item value="flat" id="r2" />
                                <Label for="r2">Flat Amount</Label>
                            </div>
                            <RadioGroup.Input name="savingsType" />
                        </div>
                  </RadioGroup.Root>
                  <Input placeholder="Enter Amount" bind:value={savingsAmount} class="col-span-3 w-[120px]"/>
                </div>
            </div>
            <input type="hidden" name="payAmount" value={payAmount} />
            <input type="hidden" name="savingsAmount" value={savingsAmount} />
            <input type="hidden" name="reoccurBills" value={reoccurBillsJson} />
            <input type="hidden" name="otherBills" value={otherBillsJson} />
            <Dialog.Footer>
                <div class="w-full flex justify-between">
                    <Button type="button" variant="secondary" onclick={addBillClick}>Add Bill</Button>
                    <Button type="submit">Submit</Button>
                </div>
            </Dialog.Footer>
        </form>
    </Dialog.Content>
</Dialog.Root>
