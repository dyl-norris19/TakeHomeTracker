<script lang="ts">
    import moneyLight from '$lib/assets/moneytalksLight.jpg';
    import moneyDark from '$lib/assets/moneytalksDark.png';
</script>

<!-- Phones get a centred, stacked layout; md and up keeps the offset heading with image and text side by side. -->
<h1 class="mt-8 mb-8 px-6 text-center text-3xl font-light md:mt-12 md:px-0 md:pl-[20vw] md:text-left md:text-5xl">
    Take Control of Your Finances!
</h1>

<div class="flex flex-col items-center px-6 pb-8 md:mt-[20vh] md:px-4">
    <!-- Image + Text -->
    <div class="flex flex-col items-center gap-8 md:flex-row md:items-stretch md:gap-[7vw]">
        <!-- Image on the left (on top on phones) -->
        <div>
            <!-- Light mode image -->
            <img
                src={moneyLight}
                alt="Money Mascot Light"
                class="block h-56 w-56 object-contain dark:hidden md:h-[30vh] md:w-[30vw]"
            />

            <!-- Dark mode image -->
            <img
                src={moneyDark}
                alt="Money Mascot Dark"
                class="hidden h-56 w-56 object-contain dark:block md:h-[30vh] md:w-[30vw]"
            />
        </div>

        <!-- Text on the right (below on phones) -->
        <p class="max-w-md text-center text-xl md:text-left md:text-3xl">
            Track your spending, set budgets, and gain insights with ease. <span class="font-bold">TakeHome Tracker</span> helps you manage your money and stay on top of your financial goals!
        </p>
    </div>
</div>
