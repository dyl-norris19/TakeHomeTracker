<script lang="ts">
    import LoginForm from "$lib/components/login-form.svelte";
    import { setTopRight } from "$lib/state/nav.svelte";
    import type { ActionData } from "./$types";

    let { form }: { form: ActionData } = $props();

    function changeCorner() {
        setTopRight("logged");
    }
</script>

<div class="flex h-screen w-full items-center justify-center px-4">
    <LoginForm {changeCorner} {form} />
</div>