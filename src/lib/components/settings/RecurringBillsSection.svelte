<script lang="ts">
    import * as Card from "$lib/components/ui/card/index";
    import * as Select from "$lib/components/ui/select/index";
    import { Input } from "$lib/components/ui/input/index";
    import { Button } from "$lib/components/ui/button/index";
    import { Badge } from "$lib/components/ui/badge/index";
    import * as ToggleGroup from "$lib/components/ui/toggle-group/index";
    import * as Table from "$lib/components/ui/table/index";
    import * as Tooltip from "$lib/components/ui/tooltip/index";
    import { buttonVariants } from "$lib/components/ui/button/index";
    import SaveBar from "$lib/components/settings/SaveBar.svelte";
    import { toast } from "svelte-sonner";
    import Trash2 from "@lucide/svelte/icons/trash-2";
    import Undo2 from "@lucide/svelte/icons/undo-2";
    import Plus from "@lucide/svelte/icons/plus";
    import {
        basisPointsToInput,
        centsToInput,
        formatCents,
        parsePercentToBasisPoints,
        parseToCents,
        percentOfCents
    } from "$lib/money";
    import { cn } from "$lib/utils";
    import { SvelteSet } from "svelte/reactivity";
    import { enhance } from "$app/forms";
    import type { Allocation, AmountType, RecurringBill } from "$lib/bills";
    import { validateRecurringBills } from "$lib/validation";

    // Strings (what the inputs hold) so the dirty check is a JSON compare;
    // toRecurringBill() converts for validation and saving.
    type Bill = {
        key: number;
        name: string;
        amount: string; // dollars for flat, percent for percent
        amountType: AmountType;
        dueDay: string; // "" = not set
        allocation: Allocation;
    };

    let {
        recurringBills,
        takeHome = "",
        dirty = $bindable(false)
    }: {
        recurringBills: RecurringBill[];
        takeHome?: string;
        dirty?: boolean;
    } = $props();

    let nextKey = 0;

    function fromServer(): Bill[] {
        return recurringBills.map((bill) => ({
            key: nextKey++,
            name: bill.name,
            amount:
                bill.amountType === "percent"
                    ? basisPointsToInput(bill.basisPoints ?? 0)
                    : centsToInput(bill.amountCents ?? 0),
            amountType: bill.amountType,
            dueDay: bill.dueDay === null ? "" : String(bill.dueDay),
            allocation: bill.allocation
        }));
    }

    // Built once so both copies share the same row keys.
    const initialBills = fromServer();
    let saved = $state<Bill[]>(structuredClone(initialBills));
    let bills = $state<Bill[]>(initialBills);
    // Deleted rows stay on screen (struck through, with Undo) until Save.
    const deleted = new SvelteSet<number>();
    let saving = $state(false);
    let serverError = $state("");

    let savedByKey = $derived(new Map(saved.map((bill) => [bill.key, JSON.stringify(bill)])));

    function rowState(bill: Bill): "new" | "deleted" | "changed" | "clean" {
        if (deleted.has(bill.key)) return "deleted";
        const original = savedByKey.get(bill.key);
        if (original === undefined) return "new";
        return original === JSON.stringify(bill) ? "clean" : "changed";
    }

    $effect(() => {
        dirty = bills.length !== saved.length || deleted.size > 0 || bills.some((bill) => rowState(bill) !== "clean");
    });

    function toRecurringBill(bill: Bill): RecurringBill {
        const percent = bill.amountType === "percent";
        return {
            name: bill.name,
            amountType: bill.amountType,
            amountCents: percent ? null : parseToCents(bill.amount),
            basisPoints: percent ? parsePercentToBasisPoints(bill.amount) : null,
            allocation: bill.allocation,
            dueDay: bill.dueDay ? Number(bill.dueDay) : null
        };
    }

    // What Save sends: every bill not marked for removal.
    let kept = $derived(bills.filter((bill) => !deleted.has(bill.key)));
    let billsJson = $derived(JSON.stringify(kept.map(toRecurringBill)));
    let error = $derived(validateRecurringBills(kept.map(toRecurringBill)) ?? "");

    const dayOptions = Array.from({ length: 31 }, (_, i) => String(i + 1));
    function ordinal(day: string): string {
        const n = Number(day);
        const suffix = n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th";
        return `${n}${suffix}`;
    }

    // Uses the salary from the pay schedule section as an example; the real
    // amount on each card comes from that card's pay.
    function percentHint(bill: Bill): string {
        const pay = parseToCents(takeHome);
        const basisPoints = parsePercentToBasisPoints(bill.amount);
        if (!Number.isInteger(pay) || pay <= 0 || !Number.isInteger(basisPoints) || basisPoints <= 0) return "";
        return `≈ ${formatCents(percentOfCents(pay, basisPoints))} of ${formatCents(pay)}`;
    }

    function addBill() {
        bills.push({ key: nextKey++, name: "", amount: "", amountType: "flat", dueDay: "", allocation: "single" });
    }

    function remove(bill: Bill) {
        if (rowState(bill) === "new") {
            bills = bills.filter((b) => b.key !== bill.key);
        } else {
            deleted.add(bill.key);
        }
    }

    function undoRemove(bill: Bill) {
        deleted.delete(bill.key);
    }

    function discard() {
        bills = structuredClone($state.snapshot(saved));
        deleted.clear();
        serverError = "";
    }

    // Edited rows aren't marked; the disabled/enabled Save button and the toast
    // cover that. Only added and to-be-removed rows get a marker.
    const rowClass: Partial<Record<ReturnType<typeof rowState>, string>> = {
        new: "border-l-emerald-500 bg-emerald-500/5",
        deleted: "border-l-red-500 bg-red-500/5"
    };
</script>

{#snippet iconButton(label: string, onclick: () => void, icon: typeof Trash2)}
    {@const Icon = icon}
    <Tooltip.Root>
        <Tooltip.Trigger type="button" aria-label={label} class={buttonVariants({ variant: "ghost", size: "icon" })} {onclick}>
            <Icon class="h-4 w-4" />
        </Tooltip.Trigger>
        <Tooltip.Content>{label}</Tooltip.Content>
    </Tooltip.Root>
{/snippet}

<form
    method="POST"
    action="?/updateRecurringBills"
    use:enhance={({ cancel }) => {
        if (error) {
            toast.error(error);
            cancel();
            return;
        }
        saving = true;
        serverError = "";
        const submitted = $state.snapshot(kept);
        return async ({ result, update }) => {
            saving = false;
            if (result.type === "success") {
                // Keep the same rows (and keys) on screen; they're now the saved state.
                bills = structuredClone(submitted);
                deleted.clear();
                saved = structuredClone(submitted);
                toast.success("Recurring bills saved");
                await update({ reset: false });
            } else if (result.type === "failure") {
                const data = result.data as { billsError?: string } | undefined;
                serverError = data?.billsError ?? "Couldn’t save — try again.";
                toast.error(serverError);
            } else {
                toast.error("Something went wrong — try again.");
                await update({ reset: false });
            }
        };
    }}
>
    <input type="hidden" name="bills" value={billsJson} />
    <Card.Root data-tour="recurring-bills">
        <Card.Header>
            <Card.Title>Recurring bills</Card.Title>
            <Card.Description>Bills that come out every month. They're added to new cards automatically based on when they're due.</Card.Description>
        </Card.Header>
        <Card.Content class="grid gap-3">
            <Table.Root>
                <Table.Header>
                    <Table.Row class="hover:bg-transparent">
                        <Table.Head>Name</Table.Head>
                        <Table.Head class="w-[210px]">Amount</Table.Head>
                        <Table.Head>How it's paid</Table.Head>
                        <Table.Head class="w-[130px]">Due</Table.Head>
                        <Table.Head class="w-[48px]"><span class="sr-only">Actions</span></Table.Head>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {#each bills as bill (bill.key)}
                        {@const rowStatus = rowState(bill)}
                        <!-- Left border + tint marks added and to-be-removed rows. -->
                        <Table.Row class={cn("border-l-4 border-l-transparent transition-colors", rowClass[rowStatus])}>
                            {#if rowStatus === "deleted"}
                                <Table.Cell colspan={4}>
                                    <div class="text-muted-foreground flex items-center gap-2">
                                        <span class="line-through">{bill.name || "Untitled bill"}</span>
                                        <Badge variant="destructive">Will be removed</Badge>
                                    </div>
                                </Table.Cell>
                                <Table.Cell>{@render iconButton("Undo remove", () => undoRemove(bill), Undo2)}</Table.Cell>
                            {:else}
                                <Table.Cell class="align-top">
                                    <div class="flex items-center gap-2">
                                        <Input placeholder="Rent, phone, Netflix…" bind:value={bill.name} />
                                        {#if rowStatus === "new"}<Badge variant="secondary">New</Badge>{/if}
                                    </div>
                                </Table.Cell>

                                <Table.Cell class="align-top">
                                    <div class="grid gap-1">
                                        <div class="flex gap-2">
                                            <Input
                                                placeholder={bill.amountType === "flat" ? "0.00" : "0"}
                                                bind:value={bill.amount}
                                                class="min-w-0"
                                            />
                                            <ToggleGroup.Root
                                                type="single"
                                                variant="outline"
                                                bind:value={() => bill.amountType, (v) => v && (bill.amountType = v as Bill["amountType"])}
                                            >
                                                <ToggleGroup.Item value="flat" aria-label="Flat amount">$</ToggleGroup.Item>
                                                <ToggleGroup.Item value="percent" aria-label="Percent of paycheck">%</ToggleGroup.Item>
                                            </ToggleGroup.Root>
                                        </div>
                                        {#if bill.amountType === "percent"}
                                            <span class="text-muted-foreground text-xs">
                                                {percentHint(bill) || "of each paycheck"}
                                            </span>
                                        {/if}
                                    </div>
                                </Table.Cell>

                                {#if bill.amountType === "percent"}
                                    <!-- % bills come off every paycheck, so how it's paid and due day don't apply. -->
                                    <Table.Cell colspan={2} class="align-top">
                                        <span class="text-muted-foreground inline-block py-2 text-sm">Comes out of every paycheck</span>
                                    </Table.Cell>
                                {:else}
                                    <Table.Cell class="align-top">
                                        <div class="grid gap-1">
                                            <ToggleGroup.Root
                                                type="single"
                                                variant="outline"
                                                class="w-fit justify-start"
                                                bind:value={() => bill.allocation, (v) => v && (bill.allocation = v as Bill["allocation"])}
                                            >
                                                <ToggleGroup.Item value="single">One paycheck</ToggleGroup.Item>
                                                <ToggleGroup.Item value="split">Split</ToggleGroup.Item>
                                            </ToggleGroup.Root>
                                            <span class="text-muted-foreground text-xs">
                                                {bill.allocation === "single"
                                                    ? "On the last paycheck on or before the due day"
                                                    : "Monthly total, shared evenly across your paychecks"}
                                            </span>
                                        </div>
                                    </Table.Cell>

                                    <!-- Split bills come off every paycheck too, so only single bills have a due day. -->
                                    <Table.Cell class="align-top">
                                        {#if bill.allocation === "single"}
                                            <Select.Root type="single" bind:value={bill.dueDay}>
                                                <Select.Trigger class={cn("w-full", !bill.dueDay && "text-muted-foreground")}>
                                                    {bill.dueDay ? `The ${ordinal(bill.dueDay)}` : "Due day"}
                                                </Select.Trigger>
                                                <Select.Content>
                                                    {#each dayOptions as day (day)}
                                                        <Select.Item value={day} label={ordinal(day)}>{ordinal(day)}</Select.Item>
                                                    {/each}
                                                </Select.Content>
                                            </Select.Root>
                                        {/if}
                                    </Table.Cell>
                                {/if}

                                <Table.Cell class="align-top">{@render iconButton("Remove bill", () => remove(bill), Trash2)}</Table.Cell>
                            {/if}
                        </Table.Row>
                    {:else}
                        <Table.Row>
                            <Table.Cell colspan={5} class="text-muted-foreground text-center">No recurring bills yet.</Table.Cell>
                        </Table.Row>
                    {/each}
                </Table.Body>
            </Table.Root>

            <Button type="button" variant="outline" class="w-fit" onclick={addBill}>
                <Plus class="mr-1 h-4 w-4" /> Add bill
            </Button>
        </Card.Content>
        <Card.Footer class="border-t pt-4">
            <SaveBar {dirty} {saving} error={dirty ? error || serverError : ""} disabled={!!error} ondiscard={discard} />
        </Card.Footer>
    </Card.Root>
</form>
