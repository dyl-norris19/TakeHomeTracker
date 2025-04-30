<script lang="ts">
    import { Input } from "$lib/components/ui/input/index";
    import { Label } from "$lib/components/ui/label/index";
    import { Button } from "$lib/components/ui/button/index";
    import * as Dialog from "$lib/components/ui/dialog/index";

    import { getReoccuringBills, updateReoccuringBills } from "$lib/database/database";

    let reoccur = $state<any>();
    let reoccurBills = $state<any[]>([]);
    let cardOpen = $state<boolean>(false);

    let { email }: {email: string } = $props();

    async function handleClick() {
        try {
            reoccur = await getReoccuringBills(email);
            reoccurBills = reoccur.bills;
        } catch (err) {
            console.error("Error: ", err);
        }
    }

    function addBillClick() {
        reoccurBills.push({
            name: "",
            amount: ""
        });
    }

    function deleteBillClick() {
        reoccurBills.pop();
    }

    async function submitBills(email: string) {
        try {
            const formData = {
                email: email,
                bills: reoccurBills.map(bill => ({
                    name: bill.name,
                    amount: Number(bill.amount)
                }))
            }

            cardOpen = false;

            await updateReoccuringBills(formData);

        } catch (err) {
            console.error("Error: ", err);
        }
    }
</script>

<Dialog.Root bind:open={cardOpen}>
    <Dialog.Trigger onclick={handleClick}>
        <Button variant="secondary">
            Edit Reoccuring Bills
        </Button>
    </Dialog.Trigger>
    <Dialog.Content>
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
        <Dialog.Footer>
            <div class="w-full flex justify-between">
                <Button variant="secondary" onclick={addBillClick}>Add Bill</Button>
                <Button class="w-[100px]"variant="destructive" onclick={deleteBillClick}>Delete Bill</Button>
                <Button onclick={() => {submitBills(email)}}>Submit</Button>
            </div>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
