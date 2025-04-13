<script lang="ts">
    import * as Card from "$lib/components/ui/card/index.js";
</script>

<div>
    <Card.Root class="max-w-[50vw] w-full mx-auto">
        <Card.Header>
            <Card.Title class="flex justify-between">
                <p>March1</p>
                <p>Pay: $100</p>
            </Card.Title>
            <Card.Description>Payday: March 4th</Card.Description>
        </Card.Header>
        <Card.Content>
            <p> Rent: $344 </p>
            <p> Electric: $150 </p>
            <p> Utilities: $35 </p>
            <p> Phone: $25</p>
        </Card.Content>
        <Card.Footer class="flex justify-between">
            <p>Savings: $100</p>
            <p>Take Home: $100</p>
        </Card.Footer>
    </Card.Root>
</div>