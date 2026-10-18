<script lang="ts">
    let {
        value,
        max,
        size = 120,
        thickness = 12
    }: {
        value: number;
        max: number;
        size?: number;
        thickness?: number;
    } = $props();

    // Clamped to 0-100, so overshooting a goal reads as 100%.
    let fraction = $derived(max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0);
    // Derived from the clamped fraction, so the label and the arc can't disagree.
    let percent = $derived(Math.floor(fraction * 100));

    let radius = $derived((size - thickness) / 2);
    let circumference = $derived(2 * Math.PI * radius);

    // Scales with the ring so the label stays proportional at any size.
    let fontSize = $derived(size * 0.22);
</script>

<svg
    width={size}
    height={size}
    viewBox="0 0 {size} {size}"
    role="img"
    aria-label="{percent}% of goal"
    class="shrink-0"
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
        font-size={fontSize}
        class="fill-foreground font-semibold"
    >
        {percent}%
    </text>
</svg>
