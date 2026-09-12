<script lang="ts">
	import { Dialog as DialogPrimitive, type WithoutChildrenOrChild } from "bits-ui";
	import X from "@lucide/svelte/icons/x";
	import type { Snippet } from "svelte";
	import * as Dialog from "./index.js";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		portalProps,
		children,
		...restProps
	}: WithoutChildrenOrChild<DialogPrimitive.ContentProps> & {
		portalProps?: DialogPrimitive.PortalProps;
		children: Snippet;
	} = $props();
</script>

<Dialog.Portal {...portalProps}>
	<Dialog.Overlay />
	<!-- added: flex-col + max-h/overflow-y-auto so tall content scrolls instead of overflowing the viewport; p-6 -> px-6 so dialog-header/dialog-footer can own vertical padding as sticky elements -->
	<DialogPrimitive.Content
		bind:ref
		class={cn(
			"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] bg-background fixed left-[50%] top-[50%] z-50 flex max-h-[85vh] w-full max-w-lg translate-x-[-50%] translate-y-[-50%] flex-col overflow-y-auto gap-4 border px-6 shadow-lg duration-200 sm:rounded-lg",
			className
		)}
		{...restProps}
	>
		{@render children?.()}
		<!-- added: z-20 keeps the close button above the now-sticky (z-10) dialog-header, so it doesn't get painted over -->
		<DialogPrimitive.Close
			class="ring-offset-background focus:ring-ring absolute right-4 top-4 z-20 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none"
		>
			<X class="size-4" />
			<span class="sr-only">Close</span>
		</DialogPrimitive.Close>
	</DialogPrimitive.Content>
</Dialog.Portal>
