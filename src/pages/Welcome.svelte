<script lang="ts">
    import { Button } from '$lib/components/ui/button/index';
    import yahoo from '../assets/yahoo.jpg'

    let { trCorner } = $props();

</script>

{@render trCorner()}

<h1 class="text-4xl md:text-5xl font-light text-left pl-[20vw] mt-12 mb-8">
    Take Control of Your Finances!
</h1>

<div class="flex flex-col items-center px-4 mt-[20vh]">
  
    <!-- Image + Text -->
    <div class="flex flex-col md:flex-row gap-[7vw]">
      <!-- Image on the left -->
      <div class="w-250 h-250 pr-[5vw] flex-shrink-0">
        <img src={yahoo} alt="Money Mascot" class="w-full h-full object-contain" />
      </div>
  
      <!-- Text on the right -->
      <p class="text-3xl text-center md:text-left max-w-md">
        Track your spending, set budgets, and gain insights with ease. <span class="font-bold">TakeHome Tracker</span> helps you manage your money and stay on top of your financial goals!
      </p>
    </div>
  </div>