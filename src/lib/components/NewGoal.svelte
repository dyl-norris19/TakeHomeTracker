<script lang="ts">
    import { Button, buttonVariants } from "$lib/components/ui/button/index";
    import * as Dialog from "$lib/components/ui/dialog/index";
    import { Input } from "$lib/components/ui/input/index";
    import { Label } from "$lib/components/ui/label/index";
    import { enhance } from "$app/forms";
    import { validateGoalForm, type GoalFormErrors } from "$lib/validation";
    import { parseToCents } from "$lib/money";

    let name = $state<string>("");
    let targetAmount = $state<string>("");
    let startingAmount = $state<string>("");

    let goalOpen = $state<boolean>(false);
    let fieldErrors = $state<GoalFormErrors>({});
    let errorMsg = $state<string>("");

    $effect(() => {
        if (!goalOpen) {
            name = "";
            targetAmount = "";
            startingAmount = "";
            fieldErrors = {};
            errorMsg = "";
        }
    });

    function validate(): GoalFormErrors {
        return validateGoalForm({
            name,
            targetCents: parseToCents(targetAmount),
            // Optional: blank means nothing saved yet.
            startingCents: startingAmount.trim() ? parseToCents(startingAmount) : 0
        });
    }
</script>

{#snippet fieldError(message: string | undefined)}
    {#if message}
        <p class="col-span-full text-sm text-red-500">{message}</p>
    {/if}
{/snippet}

<Dialog.Root bind:open={goalOpen}>
    <Dialog.Trigger type="button" class={buttonVariants({ variant: "secondary" })}>
        New Goal +
    </Dialog.Trigger>
    <Dialog.Content>
        <form
            method="POST"
            action="?/createGoal"
            use:enhance={({ cancel }) => {
                const errors = validate();
                if (Object.keys(errors).length > 0) {
                    fieldErrors = errors;
                    errorMsg = 'Please fix the highlighted fields.';
                    cancel();
                    return;
                }
                fieldErrors = {};
                errorMsg = '';
                return async ({ result, update }) => {
                    await update({ reset: false });
                    if (result.type === 'success') {
                        goalOpen = false;
                    } else if (result.type === 'failure') {
                        const data = result.data as
                            | { goalError?: string; goalFieldErrors?: GoalFormErrors }
                            | undefined;
                        fieldErrors = data?.goalFieldErrors ?? {};
                        errorMsg = data?.goalError ?? 'Something went wrong — try again.';
                    } else {
                        errorMsg = 'Something went wrong — try again.';
                    }
                };
            }}
        >
            <Dialog.Header>
                <Dialog.Title>New Savings Goal</Dialog.Title>
                <Dialog.Description>What are you saving for?</Dialog.Description>
            </Dialog.Header>
            {#if errorMsg}
                <p class="text-sm text-red-500">{errorMsg}</p>
            {/if}
            <div class="grid gap-4 py-4">
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="goalName" class="text-right">Name</Label>
                    <Input
                        id="goalName"
                        name="name"
                        placeholder="e.g. Car"
                        bind:value={name}
                        class="col-span-3 w-[180px]"
                    />
                    {@render fieldError(fieldErrors.name)}
                </div>
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="goalTarget" class="text-right">Target ($)</Label>
                    <Input
                        id="goalTarget"
                        name="targetAmount"
                        placeholder="Enter Amount"
                        bind:value={targetAmount}
                        class="col-span-3 w-[180px]"
                    />
                    {@render fieldError(fieldErrors.target)}
                </div>
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="goalStarting" class="text-right">Already saved ($)</Label>
                    <Input
                        id="goalStarting"
                        name="startingAmount"
                        placeholder="(Optional)"
                        bind:value={startingAmount}
                        class="col-span-3 w-[180px]"
                    />
                    {@render fieldError(fieldErrors.starting)}
                </div>
            </div>
            <Dialog.Footer>
                <Button type="submit">Create</Button>
            </Dialog.Footer>
        </form>
    </Dialog.Content>
</Dialog.Root>
