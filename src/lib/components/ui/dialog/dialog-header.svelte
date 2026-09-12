<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import type { WithElementRef } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<!-- added: sticky top-0 + bg-background + pt-6/pb-4 so the header stays pinned above scrolling dialog content (see dialog-content.svelte) -->
<!-- added: -mx-6 px-6 so the sticky background spans the dialog's full width (into dialog-content's px-6 gutter), matching dialog-footer's fix for the same ring-bleed issue -->
<div
	bind:this={ref}
	class={cn(
		"sticky top-0 z-10 -mx-6 flex flex-col space-y-1.5 bg-background px-6 pb-4 pt-6 text-center sm:text-left",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
