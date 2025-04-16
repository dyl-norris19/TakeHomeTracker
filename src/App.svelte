<script>
    import { Router, Link, Route } from "svelte-routing";
    import Tracker from "./pages/Tracker.svelte";
    import Login from "./pages/Login.svelte";
    import SignUp from "./pages/SignUp.svelte";

    let url = $state();

    let loggedIn = $state(false);

</script>

<Router {url}>
    <div>
        <Route path="/"><Tracker bind:value={loggedIn}/></Route>
        <Route path="/login"><Login /></Route>
        <Route path="/signup"><SignUp/></Route>
    </div>
</Router>