<script lang="ts">
    import { getAll } from "./database/database";
    import { onMount } from 'svelte';

    let users;

    onMount(async () => {
		  users = await getAll();
	});
</script>