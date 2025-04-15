<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
    import { onMount } from "svelte";

    import { authenticateUser } from "$lib/database/database";
    import type { User } from "$lib/database/database";

    let user = $state<User>({
        email: "",
        password: "",
        firstname: "",
        lastname: ""
    });

    async function handleSubmit(): Promise<void> {
        try {
            const isValid: boolean = await authenticateUser(user);

            if (isValid) {
                console.log("yippee!");
                window.location.href = '/'
            } else
                //send error
                console.log("uh oh");
        } catch (err) {
            console.log("Error: ", err);
        }
    }

</script>

<Card.Root class="mx-auto max-w-sm">
	<Card.Header>
		<Card.Title class="text-2xl">Login</Card.Title>
		<Card.Description>Enter your email below to login to your account</Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="grid gap-4">
			<div class="grid gap-2">
				<Label for="email">Email</Label>
				<Input id="email" bind:value={user.email} type="email" placeholder="m@example.com" required />
			</div>
			<div class="grid gap-2">
				<div class="flex items-center">
					<Label for="password">Password</Label>
					<a href="##" class="ml-auto inline-block text-sm underline">
						Forgot your password?
					</a>
				</div>
				<Input id="password" bind:value={user.password} type="password" required />
			</div>
			<Button type="submit" class="w-full" onclick={handleSubmit}>Login</Button>
		</div>
		<div class="mt-4 text-center text-sm">
			Don't have an account?
			<a href="/signup" class="underline"> Sign up </a>
		</div>
	</Card.Content>
</Card.Root>
