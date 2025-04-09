<script lang="ts">
    import * as Menubar from '$lib/components/ui/menubar';
    import { Button } from '$lib/components/ui/button';
    import { Moon, Sun } from 'lucide-svelte';
    import { onMount } from 'svelte';
  
    let theme = 'light';
  
    function toggleTheme() {
        theme = theme === 'light' ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('theme', theme);
    }
  
    onMount(() => {
      theme = localStorage.getItem('theme') || 'light';
      document.documentElement.classList.toggle('dark', theme === 'dark');
    });
  </script>
  
  <header class="w-full border-b shadow-sm dark:border-neutral-800">
    <div class="container mx-auto flex h-16 items-center justify-between px-4">
        <!-- Left: Menubar Navigation -->
      <Menubar.Root>
        <Menubar.Menu>
          <Menubar.Trigger>About</Menubar.Trigger>
          <Menubar.Content>
            <Menubar.Item>
              <a href="/about">Our Team</a>
            </Menubar.Item>
            <Menubar.Item>
              <a href="/about/mission">Our Mission</a>
            </Menubar.Item>
          </Menubar.Content>
        </Menubar.Menu>
        <Menubar.Menu>
          <Menubar.Trigger>Projects</Menubar.Trigger>
          <Menubar.Content>
            <Menubar.Item>
              <a href="/projects">All Projects</a>
            </Menubar.Item>
            <Menubar.Item>
              <a href="/projects/latest">Latest Projects</a>
            </Menubar.Item>
          </Menubar.Content>
        </Menubar.Menu>
        <Menubar.Menu>
          <Menubar.Trigger>Contact</Menubar.Trigger>
          <Menubar.Content>
            <Menubar.Item>
              <a href="/contact">Contact Us</a>
            </Menubar.Item>
            <Menubar.Item>
              <a href="/support">Support</a>
            </Menubar.Item>
          </Menubar.Content>
        </Menubar.Menu>
      </Menubar.Root>

      <!-- Middle: Logo -->
      <a href="/" class="text-xl font-semibold">
        TakeHome Tracker
      </a>
  
      <!-- Right: Theme Toggle & Login -->
      <div class="flex items-center gap-2">
        <Button variant="outline" size="icon" on:click={toggleTheme} aria-label="Toggle theme">
          {#if theme === 'light'}
            <Sun class="h-5 w-5" />
          {:else}
            <Moon class="h-5 w-5" />
          {/if}
        </Button>
        <Button asChild>
          <a href="/login">Login</a>
        </Button>
      </div>
    </div>
  </header>