<script lang="ts">
    import LoginForm from "$lib/components/login-form.svelte";
    import { setTopRight } from "$lib/state/nav.svelte";

    function changeCorner() {
        setTopRight("logged");
    }
</script>

<div class="flex h-screen w-full items-center justify-center px-4">
    <LoginForm {changeCorner}/>
</div>