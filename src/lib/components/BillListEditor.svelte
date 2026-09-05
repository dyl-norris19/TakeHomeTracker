<script lang="ts">
    import { Input } from "$lib/components/ui/input/index";
    import { Button } from "$lib/components/ui/button/index";

    let {
        bills = $bindable(),
        editing = $bindable(false)
    }: {
        // Parent owns the array: seeding, reset, serialization, validation.
        bills: { name: string; amount: string | number }[];
        // Bound so the parent can disable its own Submit while rows are being selected.
        editing?: boolean;
    } = $props();

    let selectedForDelete = $state<boolean[]>([]);
    let selectedCount = $derived(selectedForDelete.filter(Boolean).length);

    $effect(() => {
        if (!editing) {
            selectedForDelete = [];
        }
    });

    function addBill(): void {
        bills.push({ name: "", amount: "" });
    }

    function startDeleteMode(): void {
        selectedForDelete = bills.map(() => false);
        editing = true;
    }

    function cancelDeleteMode(): void {
        editing = false;
        selectedForDelete = [];
    }

    function confirmDelete(): void {
        bills = bills.filter((_, index) => !selectedForDelete[index]);
        editing = false;
        selectedForDelete = [];
    }
</script>

<div class="flex flex-col gap-2">
    {#if bills.length > 0}
        {#each bills as bill, index (bill)}
            <div class="flex items-center gap-2">
                {#if editing}
                    <input
                        type="checkbox"
                        class="h-4 w-4 shrink-0"
                        bind:checked={selectedForDelete[index]}
                    />
                {/if}
                <div class="grid flex-1 grid-cols-4 items-center gap-4">
                    <Input placeholder="Name" bind:value={bill.name} class="col-span-1" />
                    <Input placeholder="Amount" bind:value={bill.amount} class="col-span-3 w-[180px]" />
                </div>
            </div>
        {/each}
    {:else}
        <p class="text-muted-foreground text-sm">(None)</p>
    {/if}

    <div class="flex gap-2">
        {#if editing}
            <Button type="button" variant="secondary" onclick={cancelDeleteMode}>Cancel</Button>
            <Button
                type="button"
                variant="destructive"
                disabled={selectedCount === 0}
                onclick={confirmDelete}
            >
                Delete Selected{selectedCount > 0 ? ` (${selectedCount})` : ""}
            </Button>
        {:else}
            <Button type="button" variant="secondary" onclick={addBill}>Add Bill</Button>
            <Button
                type="button"
                variant="destructive"
                disabled={bills.length === 0}
                onclick={startDeleteMode}
            >
                Delete Bills
            </Button>
        {/if}
    </div>
</div>
