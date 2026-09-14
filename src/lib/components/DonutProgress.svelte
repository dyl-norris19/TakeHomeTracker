<script lang="ts">
    let {
        value,
        max,
        size = 72,
        thickness = 8
    }: {
        value: number;
        max: number;
        size?: number;
        thickness?: number;
    } = $props();

    // The label shows the true percent (can pass 100); the arc stops at a full ring.
    let percent = $derived(max > 0 ? Math.floor((value / max) * 100) : 0);
    let fraction = $derived(max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0);

    let radius = $derived((size - thickness) / 2);
    let circumference = $derived(2 * Math.PI * radius);
</script>

<svg
    width={size}
    height={size}
    viewBox="0 0 {size} {size}"
    role="img"
    aria-label="{percent}% of goal"
>
    <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke-width={thickness}
        class="stroke-muted"
    />
    <!-- Starts at 12 o'clock: the ring is rotated -90° around its center. -->
    <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke-width={thickness}
        stroke-linecap={fraction > 0 && fraction < 1 ? "round" : "butt"}
        stroke-dasharray={circumference}
        stroke-dashoffset={circumference * (1 - fraction)}
        transform="rotate(-90 {size / 2} {size / 2})"
        class="stroke-primary transition-[stroke-dashoffset] duration-500"
    />
    <text
        x="50%"
        y="50%"
        text-anchor="middle"
        dominant-baseline="central"
        class="fill-foreground text-xs font-semibold"
    >
        {percent}%
    </text>
</svg>
