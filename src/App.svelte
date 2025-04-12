<script>
  import { Router, Link, Route } from "svelte-routing";
  import Tracker from "./pages/Tracker.svelte";
  import Login from "./pages/Login.svelte";

  export let url = "";
</script>

<Router {url}>
  <div>
    <Route path="/"><Tracker /></Route>
    <Route path="/login"><Login /></Route>
  </div>
</Router>