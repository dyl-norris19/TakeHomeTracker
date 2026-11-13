<script lang="ts">
    import { Button, buttonVariants } from "$lib/components/ui/button/index";
    import * as Select from "$lib/components/ui/select/index";
    import { Input } from "$lib/components/ui/input/index";
    import { Textarea } from "$lib/components/ui/textarea/index";
    import { Label } from "$lib/components/ui/label/index";
    import * as RadioGroup from "$lib/components/ui/radio-group/index.js";
    import * as Dialog from "$lib/components/ui/dialog/index";
    import { enhance } from "$app/forms";
    import { untrack } from "svelte";
    import { billsForPaycheck, formatDueDate, type RecurringBill } from "$lib/bills";
    import {
        cardBreakdown,
        validateCardForm,
        type CardFormErrors,
        type CardFormValues
    } from "$lib/validation";
    import {
        basisPointsToInput,
        centsToInput,
        formatCents,
        parsePercentToBasisPoints,
        parseToCents,
        percentOfCents,
        type BudgetMode
    } from "$lib/money";
    import {
        isMonthly,
        monthOptions,
        nearestPaycheck,
        parseMonthValue,
        paycheckCountInMonth,
        resolvePaydate,
        toMonthValue,
        type PaydaySettings
    } from "$lib/paydates";
    import { resolve } from "$app/paths";
    import { monthNameToIndex } from "$lib/validation";
    import type { Card } from "$lib/server/db/queries/cards";
    import type { Goal } from "$lib/server/db/queries/savings-goals";
    import BillListEditor from "$lib/components/BillListEditor.svelte";
    import SegmentedToggle from "$lib/components/SegmentedToggle.svelte";
    import type { SampleCardForm } from "$lib/tour/sample-data";

    let {
        recurringBills = [],
        paydaySettings,
        cardToEdit,
        goals = [],
        sample,
        open = $bindable(false)
    }: {
        recurringBills?: RecurringBill[];
        paydaySettings?: PaydaySettings & { takeHomeCents?: number | null };
        cardToEdit?: Card;
        goals?: Goal[];
        // Set while the intro tour is showing this form: it opens filled with these
        // example values, can't be typed in, and can't be submitted.
        sample?: SampleCardForm;
        open?: boolean;
    } = $props();

    // Month choices are a window around today; when editing an older/newer card
    // whose month falls outside that window, add it so it stays selectable.
    let months = $derived.by(() => {
        const options = monthOptions();
        if (cardToEdit) {
            const monthIndex = monthNameToIndex(cardToEdit.month);
            const value = toMonthValue(cardToEdit.year, monthIndex);
            if (!options.some((m) => m.value === value)) {
                options.push({
                    year: cardToEdit.year,
                    monthIndex,
                    value,
                    label: `${cardToEdit.month} ${cardToEdit.year}`
                });
                options.sort((a, b) => a.value.localeCompare(b.value));
            }
        }
        return options;
    });

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
    let budgetMode = $state<BudgetMode>("splurge");
    let budgetType = $state<string>("");
    let budgetAmount = $state<string | number>("");
    // Recurring bills on this card. `basisPoints` is set for a percent bill, whose
    // amount follows the pay amount; `dueDate` (YYYY-MM-DD) for a single bill.
    type CardRecurringBill = {
        name: string;
        amount: string | number;
        basisPoints: number | null;
        dueDate: string | null;
    };
    let reoccurBills = $state<CardRecurringBill[]>([]);
    let otherBills = $state<{ name: string; amount: string | number }[]>([]);
    let notes = $state<string>("");
    let goalAmounts = $state<
        { goalId: number; name: string; closed: boolean; amount: string | number }[]
    >([]);

    let otherBillsEditing = $state<boolean>(false);

    let fieldErrors = $state<CardFormErrors>({});
    let submitError = $state<string>("");

    // Fills the recurring bills for the chosen paycheck from settings: single
    // bills whose due date falls in this pay period, plus split and percent
    // bills. Edits to them are dropped when the month or paycheck changes.
    function fillRecurringBills() {
        reoccurBills =
            paydaySettings && parsedMonth
                ? billsForPaycheck(
                      recurringBills,
                      paydaySettings,
                      parsedMonth.year,
                      parsedMonth.monthIndex,
                      monthly ? 1 : Number(paycheckNumber)
                  ).map((bill) => ({
                      name: bill.name,
                      amount: bill.amountCents === null ? "" : centsToInput(bill.amountCents),
                      basisPoints: bill.basisPoints,
                      dueDate: bill.dueDate
                  }))
                : [];
    }

    // New cards only: re-fill when the month or paycheck changes.
    $effect(() => {
        if (!cardToEdit) {
            fillRecurringBills();
        }
    });

    /** A percent bill follows the pay amount (NaN until that's a number). */
    function recurringBillCents(bill: CardRecurringBill): number {
        if (bill.basisPoints === null) {
            return parseToCents(bill.amount);
        }
        const payCents = parseToCents(payAmount);
        return Number.isInteger(payCents) ? percentOfCents(payCents, bill.basisPoints) : Number.NaN;
    }

    // While the dialog is closed, keep the form seeded so opening it shows the
    // right starting point.
    $effect(() => {
        if (!open) {
            // Example values from the intro tour, for the New Card form only.
            const example = cardToEdit ? undefined : sample;
            if (cardToEdit) {
                selectedMonth = toMonthValue(cardToEdit.year, monthNameToIndex(cardToEdit.month));
                paycheckNumber = String(cardToEdit.paycheckNumber);
                payAmount = centsToInput(cardToEdit.payAmountCents);
                budgetMode = cardToEdit.budget.mode;
                budgetType = cardToEdit.budget.method === "percent" ? "%" : "flat";
                budgetAmount =
                    cardToEdit.budget.method === "percent"
                        ? basisPointsToInput(cardToEdit.budget.basisPoints)
                        : centsToInput(cardToEdit.budget.flatCents);
                // Saved cards keep the bills they were made with; settings changes never reach them.
                reoccurBills = cardToEdit.reoccurBills.map((bill) => ({
                    name: bill.name,
                    amount: centsToInput(bill.amountCents),
                    basisPoints: null,
                    dueDate: bill.dueDate ?? null
                }));
                otherBills = cardToEdit.otherBills.map((bill) => ({
                    name: bill.name,
                    amount: centsToInput(bill.amountCents)
                }));
                notes = cardToEdit.notes ?? "";
            } else {
                // Pre-fill to the paycheck closest to today; the user can still change it.
                const nearest = paydaySettings ? nearestPaycheck(paydaySettings) : null;
                selectedMonth = nearest?.value ?? "";
                paycheckNumber = nearest ? String(nearest.paycheckNumber) : "1";
                // Prefill the usual take-home from settings; still editable per card.
                payAmount =
                    paydaySettings?.takeHomeCents != null ? centsToInput(paydaySettings.takeHomeCents) : "";
                budgetMode = "splurge";
                budgetType = "";
                budgetAmount = "";
                untrack(fillRecurringBills);
                otherBills = [];
                notes = "";
                if (example) {
                    if (paydaySettings?.takeHomeCents == null) {
                        payAmount = example.payAmount;
                    }
                    budgetType = example.budgetType;
                    budgetAmount = example.budgetAmount;
                    otherBills = example.otherBills.map((bill) => ({ ...bill }));
                }
            }
            const goalRows = goals.flatMap((goal) => {
                const existing = cardToEdit?.goalAllocations.find(
                    (allocation) => allocation.goalId === goal.id
                );
                
                if (goal.completedAt !== null && !existing) {
                    return [];
                }
                return [
                    {
                        goalId: goal.id,
                        name: goal.name,
                        closed: goal.completedAt !== null,
                        amount: existing ? centsToInput(existing.amountCents) : ""
                    }
                ];
            });
            if (example && goalRows.length > 0) {
                goalRows[0].amount = example.goalAmount;
            }
            goalAmounts = goalRows;
            confirmDuplicate = false;
            fieldErrors = {};
            submitError = "";
            otherBillsEditing = false;
        }
    });

    let budgetMethod = $derived<"percent" | "flat" | null>(
        budgetType === "%" ? "percent" : budgetType === "flat" ? "flat" : null
    );

    let saving = $derived(budgetMode === "save");

    function goalAllocationValues(): { goalId: number; amountCents: number }[] {
        return goalAmounts
            .filter((row) => String(row.amount).trim() !== "")
            .map((row) => ({ goalId: row.goalId, amountCents: parseToCents(row.amount) }));
    }

    function currentValues(): CardFormValues {
        return {
            year: parsedMonth?.year ?? Number.NaN,
            monthIndex: parsedMonth?.monthIndex ?? Number.NaN,
            paycheckNumber: monthly ? 1 : Number(paycheckNumber),
            payAmountCents: parseToCents(payAmount),
            budgetMode,
            budgetMethod,
            budgetValue:
                budgetMethod === "percent"
                    ? parsePercentToBasisPoints(budgetAmount)
                    : parseToCents(budgetAmount),
            reoccurBills: reoccurBills.map((bill) => ({
                name: bill.name,
                amountCents: recurringBillCents(bill),
                dueDate: bill.dueDate
            })),
            otherBills: otherBills.map((bill) => ({
                name: bill.name,
                amountCents: parseToCents(bill.amount)
            })),
            goalAllocations: goalAllocationValues(),
            notes: notes.trim() || null
        };
    }
    
    let breakdown = $derived(cardBreakdown(currentValues()));

    // Savings left after goals — the general/rainy-day portion. Null until the
    // savings and goal amounts are all valid numbers.
    let generalSavingsCents = $derived.by(() => {
        const allocations = goalAllocationValues();
        if (
            !breakdown ||
            allocations.some((allocation) => !Number.isInteger(allocation.amountCents))
        ) {
            return null;
        }
        const allocated = allocations.reduce((sum, allocation) => sum + allocation.amountCents, 0);
        return breakdown.savingsCents - allocated;
    });

    let reoccurBillsJson = $derived(
        JSON.stringify(
            reoccurBills.map((bill) => ({
                name: bill.name,
                amountCents: recurringBillCents(bill),
                dueDate: bill.dueDate
            }))
        )
    );
    let otherBillsJson = $derived(
        JSON.stringify(
            otherBills.map((bill) => ({ name: bill.name, amountCents: parseToCents(bill.amount) }))
        )
    );
    let goalAllocationsJson = $derived(JSON.stringify(goalAllocationValues()));

</script>

{#snippet fieldError(message: string | undefined)}
    {#if message}
        <p class="col-span-full text-sm text-red-500">{message}</p>
    {/if}
{/snippet}

<!-- A recurring bill's "% of pay" and due date. Rendered in two places (under the
     name on phones, beside the amount from sm up), only one of which is visible. -->
{#snippet billHints(bill: CardRecurringBill)}
    {#if bill.basisPoints !== null}
        <span class="text-muted-foreground text-xs">{basisPointsToInput(bill.basisPoints)}% of pay</span>
    {/if}
    {#if bill.dueDate}
        <span class="text-muted-foreground text-xs">Due {formatDueDate(bill.dueDate)}</span>
    {/if}
{/snippet}

<Dialog.Root bind:open>
    {#if !cardToEdit}
        <Dialog.Trigger type="button" class={buttonVariants()}>New Card +</Dialog.Trigger>
    {/if}
    <Dialog.Content>
        <form
            method="POST"
            action={cardToEdit ? "?/updateCard" : "?/createCard"}
            inert={!!sample}
            use:enhance={({ cancel }) => {
                // The tour's example form is only there to look at.
                if (sample) {
                    cancel();
                    return;
                }
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
                        open = false;
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
                <Dialog.Title>{cardToEdit ? "Edit Paycheck" : "New Paycheck!"}</Dialog.Title>
                <Dialog.Description>
                    {cardToEdit ? "Update the info below" : "Fill out the info below"}
                </Dialog.Description>
            </Dialog.Header>
            {#if !paydaySettings}
                <p class="text-sm text-red-500">
                    Set your pay schedule in <a href={resolve("/settings")} class="underline">Settings</a> first — new cards are dated from it.
                </p>
            {/if}
            {#if submitError}
                <p class="text-sm text-red-500">{submitError}</p>
            {/if}
            <div class="grid gap-4 py-4">
                <div class="grid gap-4" data-tour="card-basics">
                    <h2 class="font-bold">Basics</h2>
                    <div class="grid grid-cols-1 items-center gap-2 sm:grid-cols-4 sm:gap-4">
                        <Label for="month" class="sm:text-right">Month</Label>
                        <Select.Root type="single" bind:value={selectedMonth} name="month">
                            <Select.Trigger class="w-full sm:w-[180px]">
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
                        <div class="grid grid-cols-1 items-center gap-2 sm:grid-cols-4 sm:gap-4">
                            <Label for="paycheckNumber" class="sm:text-right">Paycheck #</Label>
                            <Select.Root type="single" bind:value={paycheckNumber} name="paycheckNumber">
                                <Select.Trigger class="w-full sm:w-[180px]">
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
                    <div class="grid grid-cols-1 items-center gap-2 sm:grid-cols-4 sm:gap-4">
                        <Label for="payAmt" class="sm:text-right">Pay Amount ($)</Label>
                        <Input id="payAmt" placeholder="Enter Amount" bind:value={payAmount} class="w-full sm:col-span-3 sm:w-[180px]"/>
                        {@render fieldError(fieldErrors.payAmount)}
                    </div>
                </div>
                <div class="grid gap-4" data-tour="card-recurring-bills">
                    <h2 class="font-bold">Reoccuring Bills</h2>
                    <!-- Phones: name (with its hints) on the left, amount on the right. -->
                    <div class="grid grid-cols-2 items-center gap-x-4 gap-y-3 sm:grid-cols-4 sm:gap-4">
                        {#each reoccurBills as bill (bill)}
                            {@const cents = recurringBillCents(bill)}
                            <div class="min-w-0 sm:text-right">
                                <Label>{bill.name}</Label>
                                <!-- Phones: the % and due date sit under the bill's name. -->
                                <p class="flex flex-col sm:hidden">{@render billHints(bill)}</p>
                            </div>
                            <div class="flex items-center gap-2 sm:col-span-3">
                                <!-- A percent bill shows its amount from the pay amount and follows it
                                     until typed over; typing turns it into a plain amount for this card. -->
                                <Input
                                    class="w-full sm:w-[180px]"
                                    bind:value={
                                        () => (bill.basisPoints === null ? bill.amount : Number.isInteger(cents) ? centsToInput(cents) : ""),
                                        (v) => {
                                            bill.amount = v;
                                            bill.basisPoints = null;
                                        }
                                    }
                                />
                                <!-- sm and up: the % and due date sit beside the amount. -->
                                <div class="hidden items-center gap-2 sm:flex">{@render billHints(bill)}</div>
                            </div>
                        {:else}
                            <p class="text-muted-foreground col-span-full text-sm">(None for this paycheck)</p>
                        {/each}
                        {@render fieldError(fieldErrors.reoccurBills)}
                    </div>
                </div>
                <div class="grid gap-4" data-tour="card-other-bills">
                    <h2 class="font-bold">Other Bills</h2>
                    <BillListEditor bind:bills={otherBills} bind:editing={otherBillsEditing} />
                    {@render fieldError(fieldErrors.otherBills)}
                </div>
                <div class="grid gap-4" data-tour="card-savings">
                    <div class="flex items-center justify-between gap-4">
                        <h2 class="font-bold">{saving ? "Allowance" : "Savings?"}</h2>
                        <SegmentedToggle
                            bind:value={budgetMode}
                            options={[
                                { value: "splurge", label: "Splurge" },
                                { value: "save", label: "Save" }
                            ]}
                        />
                    </div>
                    <div class="flex space-x-5">
                        <RadioGroup.Root bind:value={budgetType} name="budgetType">
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
                      <Input placeholder="Enter Amount" bind:value={budgetAmount} class="col-span-3 w-[120px]"/>
                    </div>
                    {@render fieldError(fieldErrors.budgetType)}
                    {@render fieldError(fieldErrors.budgetAmount)}
                </div>
                {#if goalAmounts.length > 0}
                    <div class="grid gap-4" data-tour="card-goals">
                        <h2 class="font-bold">Put Toward Goals</h2>
                        <div class="grid grid-cols-2 items-center gap-x-4 gap-y-3 sm:grid-cols-4 sm:gap-4">
                            {#each goalAmounts as row (row.goalId)}
                                <Label for="goal-{row.goalId}" class="sm:text-right">
                                    {row.name}{row.closed ? " (closed)" : ""}
                                </Label>
                                <Input
                                    id="goal-{row.goalId}"
                                    placeholder="$0"
                                    bind:value={row.amount}
                                    class="w-full sm:col-span-3 sm:w-[180px]"
                                />
                            {/each}
                            {@render fieldError(fieldErrors.goalAllocations)}
                        </div>
                        {#if generalSavingsCents !== null}
                            <p
                                class="text-sm"
                                class:text-muted-foreground={generalSavingsCents >= 0}
                                class:text-red-500={generalSavingsCents < 0}
                            >
                                General savings: {formatCents(generalSavingsCents)}
                            </p>
                        {/if}
                    </div>
                {/if}
                <div class="grid gap-4" data-tour="card-notes">
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
            </div>
            {#if cardToEdit}
                <input type="hidden" name="cardId" value={cardToEdit.id} />
            {/if}
            <input type="hidden" name="payAmount" value={payAmount} />
            <input type="hidden" name="budgetMode" value={budgetMode} />
            <input type="hidden" name="budgetAmount" value={budgetAmount} />
            <input type="hidden" name="reoccurBills" value={reoccurBillsJson} />
            <input type="hidden" name="otherBills" value={otherBillsJson} />
            <input type="hidden" name="goalAllocations" value={goalAllocationsJson} />
            <input type="hidden" name="confirmDuplicate" value={confirmDuplicate} />
            <Dialog.Footer class="sm:items-center">
                {#if breakdown}
                    {@const headline = saving ? breakdown.savingsCents : breakdown.takeHomeCents}
                    <p class="text-sm font-semibold sm:mr-auto">
                        {saving ? "Savings" : "Take Home"}:
                        <span class:text-red-500={headline < 0}>{formatCents(headline)}</span>
                    </p>
                {/if}
                <Button type="submit" disabled={!paydaySettings || otherBillsEditing || !resolvedPaydate}>
                    {cardToEdit ? "Save" : "Submit"}
                </Button>
            </Dialog.Footer>
        </form>
    </Dialog.Content>
</Dialog.Root>
