<script lang="ts">
	import { Toaster as Sonner, type ToasterProps as SonnerProps } from "svelte-sonner";
	// CHANGED: dropped mode-watcher; the app has its own theme toggle (Navbar.svelte), so follow its `dark` class on <html>.
	import { onMount } from "svelte";

	let { ...restProps }: SonnerProps = $props();

	// ADDED: track the `dark` class so toasts flip with the navbar toggle.
	let theme = $state<"light" | "dark">("light");
	onMount(() => {
		const root = document.documentElement;
		const sync = () => (theme = root.classList.contains("dark") ? "dark" : "light");
		sync();
		const observer = new MutationObserver(sync);
		observer.observe(root, { attributes: true, attributeFilter: ["class"] });
		return () => observer.disconnect();
	});
</script>

<Sonner
	{theme}
	class="toaster group"
	toastOptions={{
		classes: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
		},
	}}
	{...restProps}
/>
