<script lang="ts">
    import LoginForm from "$lib/components/LoginForm.svelte";
    import { page } from "$app/state";
    import type { ActionData } from "./$types";

    let { form }: { form: ActionData } = $props();

    // Set by the redirect that follows a successful password reset.
    const notice = $derived(
        page.url.searchParams.has("reset")
            ? "Your password has been reset. Log in with your new password."
            : undefined
    );
</script>

<div class="flex h-full w-full items-center justify-center px-4">
    <LoginForm {form} {notice} />
</div>