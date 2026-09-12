<script lang="ts">
    import LoginForm from "$lib/components/LoginForm.svelte";
    import type { ActionData } from "./$types";

    let { form }: { form: ActionData } = $props();
</script>

<div class="flex h-full w-full items-center justify-center px-4">
    <LoginForm {form} />
</div>