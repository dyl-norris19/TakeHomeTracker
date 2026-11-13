<script lang="ts">
	import type { WithElementRef } from "bits-ui";
	import type { HTMLAttributes } from "svelte/elements";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<!-- added: gap-2 sm:gap-0 so the stacked buttons on a phone (e.g. Cancel/Delete) have space between them; sm and up already spaces them with sm:space-x-2 -->
<div
	bind:this={ref}
	class={cn("flex flex-col-reverse gap-2 sm:gap-0 sm:flex-row sm:justify-end sm:space-x-2", className)}
	{...restProps}
>
	{@render children?.()}
</div>
