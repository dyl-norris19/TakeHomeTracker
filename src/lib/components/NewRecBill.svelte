<script lang="ts">
    import { Input } from "$lib/components/ui/input/index";
    import { Label } from "$lib/components/ui/label/index";
    import { Button } from "$lib/components/ui/button/index";
    import * as Dialog from "$lib/components/ui/dialog/index";
    import { enhance } from "$app/forms";

    let { recurringBills }: { recurringBills: { name: string; amount: number }[] } = $props();

    let reoccurBills = $state<{ name: string; amount: string | number }[]>(
        recurringBills.map((bill) => ({ name: bill.name, amount: bill.amount }))
    );
    let cardOpen = $state<boolean>(false);
    let billsJson = $derived(
        JSON.stringify(reoccurBills.map((bill) => ({ name: bill.name, amount: Number(bill.amount) })))
    );

    function addBillClick() {
        reoccurBills.push({
            name: "",
            amount: ""
        });
    }

    function deleteBillClick() {
        reoccurBills.pop();
    }
</script>

<Dialog.Root bind:open={cardOpen}>
    <Dialog.Trigger>
        <Button variant="secondary">
            Edit Reoccuring Bills
        </Button>
    </Dialog.Trigger>
    <Dialog.Content>
        <form
            method="POST"
            action="?/updateRecurringBills"
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
                <Dialog.Title>Edit Reoccuring Bills</Dialog.Title>
                <Dialog.Description>Edit your reoccuring bills below</Dialog.Description>
            </Dialog.Header>
            <div class="grid gap-4 py-4">
                <h2 class="font-bold">Reoccuring Bills</h2>
                <div class="grid grid-cols-4 items-center gap-4">
                    {#each reoccurBills as bill, index (index)}
                        <Input class="text-right" bind:value={reoccurBills[index].name} />
                        <Input class="col-span-3 w-[180px]" bind:value={reoccurBills[index].amount} />
                    {/each}
                </div>
            </div>
            <input type="hidden" name="bills" value={billsJson} />
            <Dialog.Footer>
                <div class="w-full flex justify-between">
                    <Button type="button" variant="secondary" onclick={addBillClick}>Add Bill</Button>
                    <Button type="button" class="w-[100px]" variant="destructive" onclick={deleteBillClick}>Delete Bill</Button>
                    <Button type="submit">Submit</Button>
                </div>
            </Dialog.Footer>
        </form>
    </Dialog.Content>
</Dialog.Root>
