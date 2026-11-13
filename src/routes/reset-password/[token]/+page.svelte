<script lang="ts">
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import { enhance } from "$app/forms";
    import { resolve } from "$app/paths";
    import type { ActionData, PageData } from "./$types";

    let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="flex h-full w-full items-center justify-center px-4">
    <Card.Root class="mx-auto w-full max-w-sm">
        <Card.Header>
            <Card.Title class="text-2xl">Choose a new password</Card.Title>
            {#if data.valid}
                <Card.Description>
                    You'll be logged out everywhere and can log in with the new password
                </Card.Description>
            {/if}
        </Card.Header>
        <Card.Content>
            {#if data.valid}
                <!-- novalidate: we surface our own messages from the server
                     instead of the browser's native validation bubble -->
                <form method="POST" novalidate use:enhance>
                    <div class="grid gap-4">
                        {#if form?.error}
                            <p class="text-sm text-red-500">{form.error}</p>
                        {/if}
                        <div class="grid gap-2">
                            <Label for="password">New password</Label>
                            <Input id="password" name="password" type="password" autocomplete="new-password" required />
                        </div>
                        <div class="grid gap-2">
                            <Label for="confirm-password">Confirm new password</Label>
                            <Input id="confirm-password" name="confirmPassword" type="password" autocomplete="new-password" required />
                        </div>
                        <Button type="submit" class="w-full">Reset password</Button>
                    </div>
                </form>
            {:else}
                <p class="text-sm">
                    This reset link is invalid or has expired. Links work once and last 10 minutes.
                </p>
                <Button href={resolve('/forgot-password')} class="mt-4 w-full">
                    Request a new link
                </Button>
            {/if}
        </Card.Content>
    </Card.Root>
</div>
