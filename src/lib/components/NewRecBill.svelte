<script lang="ts">
    import { Input } from "$lib/components/ui/input/index";
    import { Button, buttonVariants } from "$lib/components/ui/button/index";
    import * as Dialog from "$lib/components/ui/dialog/index";
    import { enhance } from "$app/forms";
    import { parseAmount, validateBills } from "$lib/validation";

    let { recurringBills }: { recurringBills: { name: string; amount: number }[] } = $props();

    let reoccurBills = $state<{ name: string; amount: string | number }[]>([]);
    let cardOpen = $state<boolean>(false);
    let errorMsg = $state<string>("");
    let billsJson = $derived(
        JSON.stringify(reoccurBills.map((bill) => ({ name: bill.name, amount: parseAmount(bill.amount) })))
    );

    let deleteMode = $state<boolean>(false);
    let selectedForDelete = $state<boolean[]>([]);
    let selectedCount = $derived(selectedForDelete.filter(Boolean).length);

    $effect(() => {
        if (!cardOpen) {
            reoccurBills = recurringBills.map((bill) => ({ name: bill.name, amount: bill.amount }));
            deleteMode = false;
            selectedForDelete = [];
            errorMsg = "";
        }
    });

    function validate(): string {
        const bills = reoccurBills.map((bill) => ({
            name: bill.name,
            amount: parseAmount(bill.amount)
        }));
        return validateBills(bills, "bills") ?? "";
    }

    function addBillClick() {
        reoccurBills.push({
            name: "",
            amount: ""
        });
    }

    function startDeleteMode() {
        selectedForDelete = reoccurBills.map(() => false);
        deleteMode = true;
    }

    function cancelDeleteMode() {
        deleteMode = false;
        selectedForDelete = [];
    }

    function confirmDelete() {
        reoccurBills = reoccurBills.filter((_, index) => !selectedForDelete[index]);
        deleteMode = false;
        selectedForDelete = [];
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
                <div class="grid grid-cols-4 items-center gap-4">
                    {#each reoccurBills as bill, index (bill)}
                        {#if deleteMode}
                            <input
                                type="checkbox"
                                class="justify-self-center h-4 w-4"
                                bind:checked={selectedForDelete[index]}
                            />
                            <Input bind:value={bill.name} />
                            <Input class="col-span-2 w-[180px]" bind:value={bill.amount} />
                        {:else}
                            <Input class="text-right" bind:value={bill.name} />
                            <Input class="col-span-3 w-[180px]" bind:value={bill.amount} />
                        {/if}
                    {/each}
                </div>
            </div>
            <input type="hidden" name="bills" value={billsJson} />
            <Dialog.Footer>
                {#if deleteMode}
                    <div class="w-full flex justify-between">
                        <Button type="button" variant="secondary" onclick={cancelDeleteMode}>Cancel</Button>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={selectedCount === 0}
                            onclick={confirmDelete}
                        >
                            Delete Selected{selectedCount > 0 ? ` (${selectedCount})` : ''}
                        </Button>
                    </div>
                {:else}
                    <div class="w-full flex justify-between">
                        <Button type="button" variant="secondary" onclick={addBillClick}>Add Bill</Button>
                        <Button
                            type="button"
                            class="w-[100px]"
                            variant="destructive"
                            disabled={reoccurBills.length === 0}
                            onclick={startDeleteMode}
                        >
                            Delete Bills
                        </Button>
                        <Button type="submit">Submit</Button>
                    </div>
                {/if}
            </Dialog.Footer>
        </form>
    </Dialog.Content>
</Dialog.Root>
