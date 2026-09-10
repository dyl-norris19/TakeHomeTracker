<script lang="ts">
    import { Button, buttonVariants } from "$lib/components/ui/button/index";
    import * as Dialog from "$lib/components/ui/dialog/index";
    import { enhance } from "$app/forms";
    import { validateBills } from "$lib/validation";
    import { centsToInput, parseToCents } from "$lib/money";
    import BillListEditor from "$lib/components/BillListEditor.svelte";

    let { recurringBills }: { recurringBills: { name: string; amountCents: number }[] } = $props();

    let reoccurBills = $state<{ name: string; amount: string | number }[]>([]);
    let cardOpen = $state<boolean>(false);
    let editing = $state<boolean>(false);
    let errorMsg = $state<string>("");
    let billsJson = $derived(
        JSON.stringify(
            reoccurBills.map((bill) => ({ name: bill.name, amountCents: parseToCents(bill.amount) }))
        )
    );

    $effect(() => {
        if (!cardOpen) {
            reoccurBills = recurringBills.map((bill) => ({
                name: bill.name,
                amount: centsToInput(bill.amountCents)
            }));
            editing = false;
            errorMsg = "";
        }
    });

    function validate(): string {
        const bills = reoccurBills.map((bill) => ({
            name: bill.name,
            amountCents: parseToCents(bill.amount)
        }));
        return validateBills(bills, "bills") ?? "";
    }
</script>

<Dialog.Root bind:open={cardOpen}>
    <Dialog.Trigger type="button" class={buttonVariants({ variant: "secondary" })}>
        Edit Reoccuring Bills
    </Dialog.Trigger>
    <Dialog.Content>
        <form
            method="POST"
            action="?/updateRecurringBills"
            use:enhance={({ cancel }) => {
                const problem = validate();
                if (problem) {
                    errorMsg = problem;
                    cancel();
                    return;
                }
                errorMsg = '';
                return async ({ result, update }) => {
                    await update({ reset: false });
                    if (result.type === 'success') {
                        cardOpen = false;
                    } else if (result.type === 'failure') {
                        const data = result.data as { billsError?: string } | undefined;
                        errorMsg = data?.billsError ?? 'Something went wrong — try again.';
                    } else {
                        errorMsg = 'Something went wrong — try again.';
                    }
                };
            }}
        >
            <Dialog.Header>
                <Dialog.Title>Edit Reoccuring Bills</Dialog.Title>
                <Dialog.Description>Edit your reoccuring bills below</Dialog.Description>
            </Dialog.Header>
            {#if errorMsg}
                <p class="text-sm text-red-500">{errorMsg}</p>
            {/if}
            <div class="grid gap-4 py-4">
                <h2 class="font-bold">Reoccuring Bills</h2>
                <BillListEditor bind:bills={reoccurBills} bind:editing />
            </div>
            <input type="hidden" name="bills" value={billsJson} />
            <Dialog.Footer>
                <Button type="submit" disabled={editing}>Submit</Button>
            </Dialog.Footer>
        </form>
    </Dialog.Content>
</Dialog.Root>
