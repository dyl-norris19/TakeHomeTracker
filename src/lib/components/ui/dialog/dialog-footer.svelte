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

<!-- added: sticky bottom-0 + bg-background + pt-4/pb-6 so the footer (Submit/Cancel) stays pinned below scrolling dialog content (see dialog-content.svelte) -->
<!-- added: -mx-6 px-6 so the sticky background spans the dialog's full width (into dialog-content's px-6 gutter) instead of stopping at the content edge, which otherwise let a focused field's ring bleed past the footer's sides -->
<!-- added: shadow-[0_1px_0_...] paints a 1px bg strip just below the footer. max-h-[85vh] resolves to a fractional pixel, leaving a sub-pixel seam at the footer's lower edge that leaked scrolling text through; the shadow covers it WITHOUT changing layout, so the footer doesn't shift when the scroll bottoms out (an earlier bottom:-1px approach fixed the seam but caused that shift). -->
<div
	bind:this={ref}
	class={cn(
		"sticky bottom-0 z-10 -mx-6 flex flex-col-reverse bg-background px-6 pb-6 pt-4 shadow-[0_1px_0_0_hsl(var(--background))] sm:flex-row sm:justify-end sm:space-x-2",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
