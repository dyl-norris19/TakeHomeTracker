<script lang="ts">
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import { onMount } from "svelte";
    import { signupUser } from "$lib/database/database";
    import type { User } from "$lib/database/database";
    import Navbar from "$lib/svelteComponents/Navbar.svelte";

    let user = $state<User>({
        email: "",
        password: "",
        firstname: "",
        lastname: ""
    });

    async function handleSubmit(): Promise<void> {
        try {
            console.log(user);
            
            await signupUser(user);
            window.location.href = '/login';
        } catch (err) {
            console.log("Error: ", err);
        }
    }
</script>

<Navbar />

<div class="flex h-screen w-full items-center justify-center px-4">
    <Card.Root class="mx-auto max-w-sm">
        <Card.Header>
            <Card.Title class="text-xl">Sign Up</Card.Title>
            <Card.Description
                >Enter your information to create an account</Card.Description
            >
        </Card.Header>
        <Card.Content>
            <div class="grid gap-4">
                <div class="grid grid-cols-2 gap-4">
                    <div class="grid gap-2">
                        <Label for="first-name">First name</Label>
                        <Input id="first-name" bind:value={user.firstname} placeholder="Max" required />
                    </div>
                    <div class="grid gap-2">
                        <Label for="last-name">Last name</Label>
                        <Input id="last-name" bind:value={user.lastname} placeholder="Robinson" required />
                    </div>
                </div>
                <div class="grid gap-2">
                    <Label for="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        bind:value={user.email}
                        required
                    />
                </div>
                <div class="grid gap-2">
                    <Label for="password">Password</Label>
                    <Input id="password" bind:value={user.password} type="password" />
                </div>
                <Button type="submit" class="w-full" onclick={handleSubmit}>Create an account</Button>
                <Button variant="outline" class="w-full">Sign up with GitHub</Button
                >
            </div>
            <div class="mt-4 text-center text-sm">
                Already have an account?
                <a href="/login" class="underline"> Sign in </a>
            </div>
        </Card.Content>
    </Card.Root>
</div>