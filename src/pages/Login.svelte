<script lang="ts">
    import LoginForm from "$lib/components/login-form.svelte";
    import Navbar from '$lib/svelteComponents/Navbar.svelte'

    let { value = $bindable(), trCorner, ...props} = $props();

    function changeCorner() {
        value = "logged";
    }
</script>

{@render trCorner()}

<div class="flex h-screen w-full items-center justify-center px-4">
    <LoginForm {changeCorner}/>
</div>