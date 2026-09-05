<script lang="ts">
    import { Button, buttonVariants } from "$lib/components/ui/button/index";
    import * as Select from "$lib/components/ui/select/index";
    import { Input } from "$lib/components/ui/input/index";
    import { Label } from "$lib/components/ui/label/index";
    import * as RadioGroup from "$lib/components/ui/radio-group/index.js";
    import * as Dialog from "$lib/components/ui/dialog/index";
    import { enhance } from "$app/forms";
    import {
        MONTHS,
        parseAmount,
        validateCardForm,
        type CardFormErrors,
        type CardFormValues
    } from "$lib/validation";
    import BillListEditor from "$lib/components/BillListEditor.svelte";

    let {
        recurringBills,
        paydaySettings
    }: {
        recurringBills: { name: string; amount: number }[];
        paydaySettings?: { paydate: Date; frequency: number };
    } = $props();

    const months = MONTHS.map((month) => ({ value: month, label: month }));

    let selectedMonth = $state<string>("");
    let payAmount = $state<string | number>("");
    let savingsType = $state<string>("");
    let savingsAmount = $state<string | number>("");
    let reoccurBills = $state<{ name: string; amount: string | number }[]>([]);
    let otherBills = $state<{ name: string; amount: string | number }[]>([]);

    let cardOpen = $state<boolean>(false);
    let otherBillsEditing = $state<boolean>(false);

    let fieldErrors = $state<CardFormErrors>({});
    let submitError = $state<string>("");

    $effect(() => {
        if (!cardOpen) {
            selectedMonth = "";
            payAmount = "";
            savingsType = "";
            savingsAmount = "";
            reoccurBills = recurringBills.map((bill) => ({ name: bill.name, amount: bill.amount }));
            otherBills = [];
            fieldErrors = {};
            submitError = "";
            otherBillsEditing = false;
        }
    });

    function currentValues(): CardFormValues {
        return {
            month: selectedMonth,
            payAmount: parseAmount(payAmount),
            savingsMethod:
                savingsType === "%" ? "percent" : savingsType === "flat" ? "flat" : null,
            savingsAmount: parseAmount(savingsAmount),
            reoccurBills: reoccurBills.map((bill) => ({
                name: bill.name,
                amount: parseAmount(bill.amount)
            })),
            otherBills: otherBills.map((bill) => ({
                name: bill.name,
                amount: parseAmount(bill.amount)
            }))
        };
    }

    let reoccurBillsJson = $derived(
        JSON.stringify(
            reoccurBills.map((bill) => ({ name: bill.name, amount: parseAmount(bill.amount) }))
        )
    );
    let otherBillsJson = $derived(
        JSON.stringify(
            otherBills.map((bill) => ({ name: bill.name, amount: parseAmount(bill.amount) }))
        )
    );

</script>

{#snippet fieldError(message: string | undefined)}
    {#if message}
        <p class="col-span-full text-sm text-red-500">{message}</p>
    {/if}
{/snippet}

<Dialog.Root bind:open={cardOpen}>
    <Dialog.Trigger type="button" class={buttonVariants()}>New Card +</Dialog.Trigger>
    <Dialog.Content>
        <form
            method="POST"
            action="?/createCard"
            use:enhance={({ cancel }) => {
                const errors = validateCardForm(currentValues());
                if (Object.keys(errors).length > 0) {
                    fieldErrors = errors;
                    submitError = 'Please fix the highlighted fields.';
                    cancel();
                    return;
                }
                fieldErrors = {};
                submitError = '';
                return async ({ result, update }) => {
                    await update({ reset: false });
                    if (result.type === 'success') {
                        cardOpen = false;
                    } else if (result.type === 'failure') {
                        const data = result.data as
                            | { cardError?: string; cardFieldErrors?: CardFormErrors }
                            | undefined;
                        fieldErrors = data?.cardFieldErrors ?? {};
                        submitError = data?.cardError ?? 'Something went wrong — try again.';
                    } else {
                        submitError = 'Something went wrong — try again.';
                    }
                };
            }}
        >
            <Dialog.Header>
                <Dialog.Title>New Paycheck!</Dialog.Title>
                <Dialog.Description>Fill out the info below</Dialog.Description>
            </Dialog.Header>
            {#if !paydaySettings}
                <p class="text-sm text-red-500">
                    Set your paydate first (the “Paydate” button) — new cards are dated from it.
                </p>
            {/if}
            {#if submitError}
                <p class="text-sm text-red-500">{submitError}</p>
            {/if}
            <div class="grid gap-4 py-4">
                <h2 class="font-bold">Basics</h2>
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="month" class="text-right">Month</Label>
                    <Select.Root type="single" bind:value={selectedMonth} name="month">
                        <Select.Trigger class="w-[180px]">
                            {months.find((m) => m.value === selectedMonth)?.label ?? "Select a month"}
                        </Select.Trigger>
                        <Select.Content portalProps={{ disabled: true }}>
                            <Select.Group>
                                {#each months as month (month.value)}
                                    <Select.Item value={month.value} label={month.label}>
                                        {month.label}
                                    </Select.Item>
                                {/each}
                            </Select.Group>
                        </Select.Content>
                    </Select.Root>
                    {@render fieldError(fieldErrors.month)}
                </div>
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="payAmt" class="text-right">Pay Amount ($)</Label>
                    <Input id="payAmt" placeholder="Enter Amount" bind:value={payAmount} class="col-span-3 w-[180px]"/>
                    {@render fieldError(fieldErrors.payAmount)}
                </div>
                <h2 class="font-bold">Reoccuring Bills</h2>
                <div class="grid grid-cols-4 items-center gap-4">
                    {#each reoccurBills as bill (bill)}
                        <Label class="text-right">{bill.name}</Label>
                        <Input class="col-span-3 w-[180px]" bind:value={bill.amount} />
                    {/each}
                    {@render fieldError(fieldErrors.reoccurBills)}
                </div>
                <h2 class="font-bold">Other Bills</h2>
                <BillListEditor bind:bills={otherBills} bind:editing={otherBillsEditing} />
                {@render fieldError(fieldErrors.otherBills)}
                <h2 class="font-bold">Savings?</h2>
                <div class="flex space-x-5">
                    <RadioGroup.Root bind:value={savingsType} name="savingsType">
                        <div class="flex space-x-4">
                            <div class="flex items-center space-x-2">
                                <RadioGroup.Item value="%" id="r1" />
                                <Label for="r1">%</Label>
                            </div>
                            <div class="flex items-center space-x-2">
                                <RadioGroup.Item value="flat" id="r2" />
                                <Label for="r2">Flat Amount</Label>
                            </div>
                        </div>
                  </RadioGroup.Root>
                  <Input placeholder="Enter Amount" bind:value={savingsAmount} class="col-span-3 w-[120px]"/>
                </div>
                {@render fieldError(fieldErrors.savingsType)}
                {@render fieldError(fieldErrors.savingsAmount)}
            </div>
            <input type="hidden" name="payAmount" value={payAmount} />
            <input type="hidden" name="savingsAmount" value={savingsAmount} />
            <input type="hidden" name="reoccurBills" value={reoccurBillsJson} />
            <input type="hidden" name="otherBills" value={otherBillsJson} />
            <Dialog.Footer>
                <Button type="submit" disabled={!paydaySettings || otherBillsEditing}>Submit</Button>
            </Dialog.Footer>
        </form>
    </Dialog.Content>
</Dialog.Root>
