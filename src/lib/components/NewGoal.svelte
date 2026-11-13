<script lang="ts">
    import { Button, buttonVariants } from "$lib/components/ui/button/index";
    import * as Dialog from "$lib/components/ui/dialog/index";
    import { Input } from "$lib/components/ui/input/index";
    import { Label } from "$lib/components/ui/label/index";
    import { enhance } from "$app/forms";
    import { validateGoalForm, type GoalFormErrors } from "$lib/validation";
    import { parseToCents } from "$lib/money";
    import type { SampleGoalForm } from "$lib/tour/sample-data";

    let {
        open: goalOpen = $bindable(false),
        sample
    }: {
        open?: boolean;
        // Set while the intro tour is showing this form: it opens filled with these
        // example values, can't be typed in, and can't be submitted.
        sample?: SampleGoalForm;
    } = $props();

    let name = $state<string>("");
    let targetAmount = $state<string>("");
    let startingAmount = $state<string>("");

    let fieldErrors = $state<GoalFormErrors>({});
    let errorMsg = $state<string>("");

    $effect(() => {
        if (!goalOpen) {
            name = sample?.name ?? "";
            targetAmount = sample?.targetAmount ?? "";
            startingAmount = sample?.startingAmount ?? "";
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
    <Dialog.Content data-tour="new-goal-dialog">
        <form
            method="POST"
            action="?/createGoal"
            inert={!!sample}
            use:enhance={({ cancel }) => {
                // The tour's example form is only there to look at.
                if (sample) {
                    cancel();
                    return;
                }
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
                <div class="grid grid-cols-1 items-center gap-2 sm:grid-cols-4 sm:gap-4">
                    <Label for="goalName" class="sm:text-right">Name</Label>
                    <Input
                        id="goalName"
                        name="name"
                        placeholder="e.g. Car"
                        bind:value={name}
                        class="w-full sm:col-span-3 sm:w-[180px]"
                    />
                    {@render fieldError(fieldErrors.name)}
                </div>
                <div class="grid grid-cols-1 items-center gap-2 sm:grid-cols-4 sm:gap-4">
                    <Label for="goalTarget" class="sm:text-right">Target ($)</Label>
                    <Input
                        id="goalTarget"
                        name="targetAmount"
                        placeholder="Enter Amount"
                        bind:value={targetAmount}
                        class="w-full sm:col-span-3 sm:w-[180px]"
                    />
                    {@render fieldError(fieldErrors.target)}
                </div>
                <div class="grid grid-cols-1 items-center gap-2 sm:grid-cols-4 sm:gap-4">
                    <Label for="goalStarting" class="sm:text-right">Already saved ($)</Label>
                    <Input
                        id="goalStarting"
                        name="startingAmount"
                        placeholder="(Optional)"
                        bind:value={startingAmount}
                        class="w-full sm:col-span-3 sm:w-[180px]"
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
