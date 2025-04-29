<script lang="ts">
    import { Button } from "$lib/components/ui/button/index";
    import * as Select from "$lib/components/ui/select/index";
    import { Input } from "$lib/components/ui/input/index";
    import { Label } from "$lib/components/ui/label/index";
    import * as RadioGroup from "$lib/components/ui/radio-group/index.js";
    import * as Dialog from "$lib/components/ui/dialog/index";

    import { uploadNewCard, getReoccuringBills } from "$lib/database/database";
    import { onMount } from "svelte";
    

    let selectedMonthObj = $state<{value: string, label: string }>({value: "", label: ""});
    let selectedMonth = $derived(selectedMonthObj.value);
    let payAmount = $state<number>(null);
    let otherBillNames = $state<string[]>([]);
    let otherBillAmounts = $state<number[]>([]);
    let savingsType = $state<string>("");
    let saveByPercent = $derived(savingsType === "%");
    let savingsAmount = $state<number>(null);

    let cardOpen = $state<boolean>(false);

    let { cardAdded, email }: { cardAdded: any, email: string } = $props();
    
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

    let reoccurBills = $state<any[]>([]);
    let otherBills = $state<string[]>([]);

    // onMount(() => {
    //     getReoccuringBills(email);
    // });

    async function handleClick(): Promise<void> {
        try {
            reoccurBills = await getReoccuringBills(email);
            // console.log("reoccurBills set: ", reoccurBills[0].name, reoccurBills[0].amount);
        } catch (err) {
            console.log("Error: ", err);
        }
    }

    function addBillClick(): void {
        otherBills.push("");
    }

    function deleteBillClick(): void {
        otherBills.pop();
    }

    async function submitCard(email: string): Promise<void> {
        try {
            console.log("submit card: ", email);
            const formData = {
                userid: email,
                month: selectedMonth,
                payAmount: Number(payAmount),
                reoccurBills: reoccurBills.map(bill => ({
                    name: bill.name,
                    amount: Number(bill.amount)
                })),
                otherBills: otherBillNames.map((name, i) => ({
                    name,
                    amount: Number(otherBillAmounts[i])
                })),
                savings: {
                    method: saveByPercent,
                    amount: Number(savingsAmount)
                }
            };

            cardOpen = false;

            selectedMonthObj = {value: "", label: ""};
            payAmount = null;
            otherBillNames = []
            otherBillAmounts = []
            savingsType = ""
            savingsAmount = null;

            await uploadNewCard(formData);

            cardAdded();

        } catch (err) {
            console.log("error: ", err);
        }
    }

</script>

<Dialog.Root bind:open={cardOpen}>
    <Dialog.Trigger onclick={handleClick}>
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
                <Select.Root bind:selected={selectedMonthObj} portal={null}>
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
                    <Select.Input name="month" />
                </Select.Root>
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
                <Label for="payAmt" class="text-right">Pay Amount ($)</Label>
                <Input id="payAmt" placeholder="Enter Amount" bind:value={payAmount} class="col-span-3 w-[180px]"/>
            </div>
            <h2 class="font-bold">Reoccuring Bills</h2>
            <div class="grid grid-cols-4 items-center gap-4">
                {#each reoccurBills as bill, index (index)}
                    <Label for="reoccur" class="text-right">{reoccurBills[index].name}</Label>
                    <Input id="reoccur" class="col-span-3 w-[180px]" bind:value={reoccurBills[index].amount} />
                {/each}
            </div>
            <h2 class="font-bold">Other Bills</h2>
            {#if otherBills.length > 0}
            <Button class="w-[100px]"variant="destructive" onclick={deleteBillClick}>Delete Bill</Button>
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
                <Button variant="secondary" onclick={addBillClick}>Add Bill</Button>
                <Button onclick={() => {submitCard(email)}}>Submit</Button>
            </div>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
