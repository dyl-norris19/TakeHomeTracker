<script lang="ts">
    import { Button, buttonVariants } from "$lib/components/ui/button/index";
    import * as Select from "$lib/components/ui/select/index";
    import { Input } from "$lib/components/ui/input/index";
    import { Textarea } from "$lib/components/ui/textarea/index";
    import { Label } from "$lib/components/ui/label/index";
    import * as RadioGroup from "$lib/components/ui/radio-group/index.js";
    import * as Dialog from "$lib/components/ui/dialog/index";
    import { enhance } from "$app/forms";
    import {
        validateCardForm,
        type CardFormErrors,
        type CardFormValues
    } from "$lib/validation";
    import { centsToInput, parsePercentToBasisPoints, parseToCents } from "$lib/money";
    import {
        isMonthly,
        monthOptions,
        nearestPaycheck,
        parseMonthValue,
        paycheckCountInMonth,
        resolvePaydate
    } from "$lib/paydates";
    import BillListEditor from "$lib/components/BillListEditor.svelte";

    let {
        recurringBills,
        paydaySettings
    }: {
        recurringBills: { name: string; amountCents: number }[];
        paydaySettings?: { paydate: Date; frequency: number };
    } = $props();

    const months = monthOptions();
    const dateFmt = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
    });

    let monthly = $derived(paydaySettings ? isMonthly(paydaySettings) : false);

    let selectedMonth = $state<string>("");
    let paycheckNumber = $state<string>("1");
    let confirmDuplicate = $state<boolean>(false);

    let parsedMonth = $derived(parseMonthValue(selectedMonth));
    let paycheckCount = $derived(
        paydaySettings && parsedMonth
            ? paycheckCountInMonth(paydaySettings, parsedMonth.year, parsedMonth.monthIndex)
            : 0
    );
    let paycheckChoices = $derived(Array.from({ length: paycheckCount }, (_, i) => i + 1));
    let resolvedPaydate = $derived(
        paydaySettings && parsedMonth
            ? resolvePaydate(
                  paydaySettings,
                  parsedMonth.year,
                  parsedMonth.monthIndex,
                  monthly ? 1 : Number(paycheckNumber)
              )
            : null
    );

    // On any change to the chosen month or paycheck: drop a pending duplicate
    // confirmation, and clamp a paycheck number the new month can't satisfy.
    $effect(() => {
        const selection = { month: selectedMonth, number: paycheckNumber };
        confirmDuplicate = false;
        if (paycheckCount > 0 && Number(selection.number) > paycheckCount) {
            paycheckNumber = "1";
        }
    });

    let payAmount = $state<string | number>("");
    let savingsType = $state<string>("");
    let savingsAmount = $state<string | number>("");
    let reoccurBills = $state<{ name: string; amount: string | number }[]>([]);
    let otherBills = $state<{ name: string; amount: string | number }[]>([]);
    let notes = $state<string>("");

    let cardOpen = $state<boolean>(false);
    let otherBillsEditing = $state<boolean>(false);

    let fieldErrors = $state<CardFormErrors>({});
    let submitError = $state<string>("");

    $effect(() => {
        if (!cardOpen) {
            // Pre-fill to the paycheck closest to today; the user can still change it.
            const nearest = paydaySettings ? nearestPaycheck(paydaySettings) : null;
            selectedMonth = nearest?.value ?? "";
            paycheckNumber = nearest ? String(nearest.paycheckNumber) : "1";
            confirmDuplicate = false;
            payAmount = "";
            savingsType = "";
            savingsAmount = "";
            reoccurBills = recurringBills.map((bill) => ({
                name: bill.name,
                amount: centsToInput(bill.amountCents)
            }));
            otherBills = [];
            notes = "";
            fieldErrors = {};
            submitError = "";
            otherBillsEditing = false;
        }
    });

    let savingsMethod = $derived<"percent" | "flat" | null>(
        savingsType === "%" ? "percent" : savingsType === "flat" ? "flat" : null
    );

    function currentValues(): CardFormValues {
        return {
            year: parsedMonth?.year ?? Number.NaN,
            monthIndex: parsedMonth?.monthIndex ?? Number.NaN,
            paycheckNumber: monthly ? 1 : Number(paycheckNumber),
            payAmountCents: parseToCents(payAmount),
            savingsMethod,
            savingsValue:
                savingsMethod === "percent"
                    ? parsePercentToBasisPoints(savingsAmount)
                    : parseToCents(savingsAmount),
            reoccurBills: reoccurBills.map((bill) => ({
                name: bill.name,
                amountCents: parseToCents(bill.amount)
            })),
            otherBills: otherBills.map((bill) => ({
                name: bill.name,
                amountCents: parseToCents(bill.amount)
            })),
            notes: notes.trim() || null
        };
    }

    let reoccurBillsJson = $derived(
        JSON.stringify(
            reoccurBills.map((bill) => ({ name: bill.name, amountCents: parseToCents(bill.amount) }))
        )
    );
    let otherBillsJson = $derived(
        JSON.stringify(
            otherBills.map((bill) => ({ name: bill.name, amountCents: parseToCents(bill.amount) }))
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
                            | {
                                  cardError?: string;
                                  cardFieldErrors?: CardFormErrors;
                                  cardDuplicate?: boolean;
                              }
                            | undefined;
                        fieldErrors = data?.cardFieldErrors ?? {};
                        submitError = data?.cardError ?? 'Something went wrong — try again.';
                        if (data?.cardDuplicate) {
                            confirmDuplicate = true;
                        }
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
                {#if !monthly}
                    <div class="grid grid-cols-4 items-center gap-4">
                        <Label for="paycheckNumber" class="text-right">Paycheck #</Label>
                        <Select.Root type="single" bind:value={paycheckNumber} name="paycheckNumber">
                            <Select.Trigger class="w-[180px]">
                                {paycheckNumber ? `Paycheck ${paycheckNumber}` : "Select"}
                            </Select.Trigger>
                            <Select.Content portalProps={{ disabled: true }}>
                                <Select.Group>
                                    {#each paycheckChoices as n (n)}
                                        <Select.Item value={String(n)} label={`Paycheck ${n}`}>
                                            Paycheck {n}
                                        </Select.Item>
                                    {/each}
                                </Select.Group>
                            </Select.Content>
                        </Select.Root>
                        {@render fieldError(fieldErrors.paycheckNumber)}
                    </div>
                {/if}
                {#if resolvedPaydate}
                    <p class="col-span-full text-sm text-muted-foreground">
                        Pays {dateFmt.format(resolvedPaydate)}
                    </p>
                {:else if selectedMonth}
                    <p class="col-span-full text-sm text-red-500">
                        That month doesn’t have a paycheck {paycheckNumber}.
                    </p>
                {/if}
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
                <h2 class="font-bold">Notes</h2>
                <div class="grid grid-cols-4 items-start gap-4">
                    <Textarea
                        id="notes"
                        name="notes"
                        placeholder="(Optional)"
                        bind:value={notes}
                        class="col-span-4"
                    />
                </div>
            </div>
            <input type="hidden" name="payAmount" value={payAmount} />
            <input type="hidden" name="savingsAmount" value={savingsAmount} />
            <input type="hidden" name="reoccurBills" value={reoccurBillsJson} />
            <input type="hidden" name="otherBills" value={otherBillsJson} />
            <input type="hidden" name="confirmDuplicate" value={confirmDuplicate} />
            <Dialog.Footer>
                <Button type="submit" disabled={!paydaySettings || otherBillsEditing || !resolvedPaydate}>Submit</Button>
            </Dialog.Footer>
        </form>
    </Dialog.Content>
</Dialog.Root>
