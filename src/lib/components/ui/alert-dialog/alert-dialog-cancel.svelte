<script lang="ts">
	import { AlertDialog as AlertDialogPrimitive } from "bits-ui";
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: AlertDialogPrimitive.CancelProps = $props();
</script>

<!-- changed: removed "mt-2 sm:mt-0"; alert-dialog-footer now supplies the phone gap with gap-2, so this would double it -->
<AlertDialogPrimitive.Cancel
	bind:ref
	class={cn(buttonVariants({ variant: "outline" }), className)}
	{...restProps}
/>
