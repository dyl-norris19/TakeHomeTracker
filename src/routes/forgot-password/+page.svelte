<script lang="ts">
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import { enhance } from "$app/forms";
    import { resolve } from "$app/paths";
    import type { ActionData } from "./$types";

    let { form }: { form: ActionData } = $props();
</script>

<div class="flex h-full w-full items-center justify-center px-4">
    <Card.Root class="mx-auto w-full max-w-sm">
        <Card.Header>
            <Card.Title class="text-2xl">Reset your password</Card.Title>
            <Card.Description>
                {#if form?.sent}
                    Check your email
                {:else}
                    Enter your email and we'll send you a link to choose a new password
                {/if}
            </Card.Description>
        </Card.Header>
        <Card.Content>
            {#if form?.sent}
                <p class="text-sm">
                    If there's an account for that email, a reset link is on its way. It expires
                    in 10 minutes, and it may land in your spam folder.
                </p>
            {:else}
                <!-- novalidate: we surface our own messages from the server
                     instead of the browser's native validation bubble -->
                <form method="POST" novalidate use:enhance>
                    <div class="grid gap-4">
                        {#if form?.error}
                            <p class="text-sm text-red-500">{form.error}</p>
                        {/if}
                        <div class="grid gap-2">
                            <Label for="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="m@example.com"
                                value={form?.email ?? ""}
                                required
                            />
                        </div>
                        <Button type="submit" class="w-full">Send reset link</Button>
                    </div>
                </form>
            {/if}
            <div class="mt-4 text-center text-sm">
                <a href={resolve('/login')} class="underline">Back to login</a>
            </div>
        </Card.Content>
    </Card.Root>
</div>
