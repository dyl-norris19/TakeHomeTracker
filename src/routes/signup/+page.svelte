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
    <Card.Root class="mx-auto max-w-sm">
        <Card.Header>
            <Card.Title class="text-xl">Sign Up</Card.Title>
            <Card.Description>Enter your information to create an account</Card.Description>
        </Card.Header>
        <Card.Content>
            <!-- novalidate: we surface our own field messages from the server
                 instead of the browser's native validation bubble -->
            <form method="POST" novalidate use:enhance>
                <div class="grid gap-4">
                    {#if form?.error}
                        <p class="text-sm text-red-500">{form.error}</p>
                    {/if}
                    <div class="grid grid-cols-2 gap-4">
                        <div class="grid gap-2">
                            <Label for="first-name">First name</Label>
                            <Input id="first-name" name="firstname" value={form?.firstName ?? ""} placeholder="Max" required />
                        </div>
                        <div class="grid gap-2">
                            <Label for="last-name">Last name</Label>
                            <Input id="last-name" name="lastname" value={form?.lastName ?? ""} placeholder="Robinson" required />
                        </div>
                    </div>
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
                    <div class="grid gap-2">
                        <Label for="password">Password</Label>
                        <Input id="password" name="password" type="password" required />
                    </div>
                    <div class="grid gap-2">
                        <Label for="confirm-password">Confirm password</Label>
                        <Input id="confirm-password" name="confirmPassword" type="password" required />
                    </div>
                    <Button type="submit" class="w-full">Create an account</Button>
                    <!-- TODO: GitHub OAuth not implemented yet — hidden until it is
                    <Button variant="outline" class="w-full" type="button">Sign up with GitHub</Button>
                    -->
                </div>
            </form>
            <div class="mt-4 text-center text-sm">
                Already have an account?
                <a href={resolve('/login')} class="underline"> Sign in </a>
            </div>
        </Card.Content>
    </Card.Root>
</div>