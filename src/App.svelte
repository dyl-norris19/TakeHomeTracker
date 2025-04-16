<script>
    import { Router, Link, Route } from "svelte-routing";
    import Tracker from "./pages/Tracker.svelte";
    import Login from "./pages/Login.svelte";
    import SignUp from "./pages/SignUp.svelte";
    import Welcome from "./pages/Welcome.svelte";

    import Navbar from '$lib/svelteComponents/Navbar.svelte';
    import { Button } from '$lib/components/ui/button/index';

    let url = $state();

    let toprightComponent = $state("");

</script>
{#snippet bruh1()}
    <Button onclick={() => {toprightComponent = "logging"}}>
        <Link to="/login">
            Login
        </Link>
    </Button>
{/snippet}

{#snippet bruh2()}
    <Button onclick={() => {toprightComponent = "login"}}>
        <Link to="/">
            Log out
        </Link>
    </Button>
{/snippet}

{#snippet bruh3()}
    <Button>
        (idk what this needs to be)
    </Button>
{/snippet}

{#snippet trCorner()}
    {#if toprightComponent === "login"}
        <Navbar>
            {@render bruh1()}
        </Navbar>
    {:else if toprightComponent === "logged"}
        <Navbar>
            {@render bruh2()}
        </Navbar>
    {:else if toprightComponent === "logging"}
        <Navbar>
            {@render bruh3()}
        </Navbar>
    {:else}
        <Navbar>
            {@render bruh1()}
        </Navbar>
    {/if}
{/snippet}

<Router {url}>
    <div>
        <Route path="/"><Welcome bind:value={toprightComponent} {trCorner} /></Route>
        <Route path="/tracker"><Tracker bind:value={toprightComponent} {trCorner}/></Route>
        <Route path="/login"><Login bind:value={toprightComponent} {trCorner}/></Route>
        <Route path="/signup"><SignUp bind:value={toprightComponent} {trCorner}/></Route>
    </div>
</Router>