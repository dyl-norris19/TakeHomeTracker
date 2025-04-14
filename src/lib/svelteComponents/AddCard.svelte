<script lang="ts">
    import { Button } from "$lib/components/ui/button/index";
    import * as Select from "$lib/components/ui/select/index";
    import { Input } from "$lib/components/ui/input/index";
    import { Label } from "$lib/components/ui/label/index";
    import * as RadioGroup from "$lib/components/ui/radio-group/index.js";
    import * as Dialog from "$lib/components/ui/dialog/index";

    let selectedMonth = $state<string>("");
    let payAmount = $state<number>(null);
    let rentAmount = $state<number>(null);
    let otherBillNames = $state<string[]>([]);
    let otherBillAmounts = $state<number[]>([]);
    let savingsType = $state<string>("");
    let saveByPercent = $derived(savingsType === "%");
    let savingsAmount = $state<number>(null);
    
    type Month = {
        value: string;
        label: string;
    };

    const months: Month[] = [
        { value: "march", label: "March" },
        { value: "april", label: "April" },
        { value: "may", label: "May" },
    ];

    let otherBills = $state<string[]>(["meow", "bruh", "grandma"])

    function addBillClick(): void {
        otherBills.push("");
    }

    function deleteBillClick(): void {
        otherBills.pop();
    }

    function submitCard(): void {
        const formData = {
            month: selectedMonth,
            payAmount,
            rentAmount,
            otherBills: otherBillNames.map((name, i) => ({
                name,
                amount: otherBillAmounts[i]
            })),
            savings: {
                method: saveByPercent,
                amount: savingsAmount
            }
        };

        console.log("Form Data: ", formData);
    }

</script>

<Dialog.Root open>
    <Dialog.Trigger>
        <Button>New Card +</Button>
    </Dialog.Trigger>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title>New Paycheck!</Dialog.Title>
            <Dialog.Description>Fill out the info below</Dialog.Description>
        </Dialog.Header>
        <div class="grid gap-4 py-4">
            <h2 class="font-bold">Basics</h2>
            <div class="grid grid-cols-4 items-center gap-4">
                <Label for="month" class="text-right">Month</Label>
                <Select.Root on:change={(e) => selectedMonth = e.detail.value} portal={null}>
                    <Select.Trigger class="w-[180px]">
                        <Select.Value placeholder="Select a month" />
                    </Select.Trigger>
                    <Select.Content>
                        <Select.Group>
                            {#each months as month}
                                <Select.Item value={month.value} label={month.label}>
                                    {month.label}
                                </Select.Item>
                            {/each}
                        </Select.Group>
                    </Select.Content>
                    <Select.Input name="month" bind:value={selectedMonth} />
                </Select.Root>
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
                <Label for="payAmt" class="text-right">Pay Amount ($)</Label>
                <Input id="payAmt" placeholder="Enter Amount" bind:value={payAmount} class="col-span-3 w-[180px]"/>
            </div>
            <h2 class="font-bold">Reoccuring Bills</h2>
            <div class="grid grid-cols-4 items-center gap-4">
                <Label for="reoccur" class="text-right">Rent</Label>
                <Input id="reoccur" bind:value={rentAmount} class="col-span-3 w-[180px]" />
            </div>
            <h2 class="font-bold">Other Bills</h2>
            <Button class="w-[100px]"variant="destructive" on:click={deleteBillClick}>Delete Bill</Button>
            {#if otherBills.length > 0}
                <div class="grid grid-cols-5 items-center gap-4">
                    {#each otherBills as bill, index (index)}
                        <Input placeholder="Bill Name" bind:value={otherBillNames[index]} class="col-span-2"/>
                        <Input id="others" placeholder="Enter Amount" bind:value={otherBillAmounts[index]} class="col-span-2 w-[180px]" />
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
              <Input id="savingsAmt" placeholder="Enter Amount" bind:value={savingsAmount} class="col-span-3 w-[120px]"/>
            </div>
        </div>
        <Dialog.Footer>
            <div class="w-full flex justify-between">
                <Button variant="secondary" on:click={addBillClick}>Add Bill</Button>
                <Button on:click={submitCard}>Submit</Button>
            </div>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
