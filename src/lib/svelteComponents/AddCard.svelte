<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import * as Dialog from "$lib/components/ui/dialog/index.js"

</script>

<Dialog.Root open>
    <Dialog.Trigger>
      <Button>New Card +</Button>
    </Dialog.Trigger>
    <Dialog.Content class="h-[50vh]">
      <Dialog.Header class="h-[5vh]">
        <Dialog.Title class="sr-only">
          hola
        </Dialog.Title>
        <Dialog.Description>
          This action cannot be undone. This will permanently delete your account
          and remove your data from our servers.
        </Dialog.Description>
      </Dialog.Header>
      <h2>HELLO?</h2>
      
    <Dialog.Footer>
      meow
    </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>