import { tick } from 'svelte';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { page } from '$app/state';
import type { Driver, DriveStep } from 'driver.js';
import { TOUR_STEPS, type TourDialog, type TourRoute, type TourStep } from './steps';

// Remembers the current step so a refresh mid-tour picks up where it was.
const STORAGE_KEY = 'tht-tour-step';

// The dialog's open/close animation runs for 200ms; a step inside it is only
// measured correctly once that has finished.
const DIALOG_SETTLE_MS = 250;

function sleep(ms: number) {
    return new Promise((done) => setTimeout(done, ms));
}

/** An optional step whose element isn't on the page, so there is nothing to show for it. */
function isMissing(step: TourStep): boolean {
    return !!step.optional && !!step.element && !document.querySelector(step.element);
}

function toDriveStep(step: TourStep): DriveStep {
    return {
        element: step.element,
        // The dialog traps keyboard focus, so the popover leaves focus alone there.
        focus: step.dialog ? 'none' : undefined,
        // Everything else is look-only, but a nav step's button is there to be clicked.
        disableActiveInteraction: step.nav ? false : undefined,
        popover: {
            title: step.title,
            description: step.description,
            side: step.side,
            align: step.align
        }
    };
}

/**
 * Runs the intro tour. driver.js draws the highlight and popover; this decides
 * which step comes next and gets the app ready for it (right page, New Card
 * dialog open or closed) before driver.js shows it.
 *
 * One instance is shared by the whole app and kept alive by the root layout,
 * which is what lets the tour carry on across /tracker and /settings.
 */
class Tour {
    /** True while the tour is on screen. The tracker shows a sample card off this. */
    active = $state(false);
    /** Whether each of the tracker's dialogs is open, bound here so the tour can open and close them. */
    dialogs = $state<Record<TourDialog, boolean>>({
        'new-card': false,
        'new-goal': false,
        'adjust-goal': false
    });

    #driver: Driver | undefined;
    #index = 0;
    #busy = false;
    // Set while the tour destroys driver.js itself, so that isn't mistaken for the user closing it.
    #silent = false;
    #resumeChecked = false;
    #starting = false;
    // Seen during this visit. The account's flag is saved straight away, but the
    // layout's copy of the user only catches up the next time it reloads.
    #seen = false;

    /**
     * Called by the root layout on load and after every navigation. Resumes a
     * tour interrupted by a refresh, or starts it for a user who hasn't seen it.
     */
    sync(user: { hasSeenTour: boolean } | null, routeId: string | null) {
        if (!user) {
            this.#end(false);
            sessionStorage.removeItem(STORAGE_KEY);
            return;
        }

        if (this.active) {
            // The user clicked the button a nav step was pointing at and has landed
            // on the next step's page, so carry on from there.
            const next = TOUR_STEPS[this.#index + 1];
            if (TOUR_STEPS[this.#index].nav && next?.route === routeId) {
                void this.#go(this.#index + 1, 1);
            }
            return;
        }

        if (!this.#resumeChecked) {
            this.#resumeChecked = true;
            const stored = Number(sessionStorage.getItem(STORAGE_KEY) ?? Number.NaN);
            if (Number.isInteger(stored) && stored >= 0 && stored < TOUR_STEPS.length) {
                void this.start(stored);
                return;
            }
        }

        if (!user.hasSeenTour && !this.#seen && routeId === '/tracker') {
            void this.start();
        }
    }

    /** Starts the tour (from the top unless resuming), going to the right page first. */
    async start(index = 0) {
        if (this.active || this.#starting) {
            return;
        }

        this.#starting = true;
        try {
            // Get to the first step's page before anything changes on screen. If
            // settings has unsaved edits it asks about leaving, and the tour waits
            // to be started again rather than replacing those edits with examples.
            if (!(await this.#navigate(TOUR_STEPS[index].route))) {
                return;
            }

            this.active = true;
            await this.#createDriver();
            await this.#go(index, 1);
        } finally {
            this.#starting = false;
        }
    }

    /** Goes to `route` if not already there. False if the navigation was cancelled. */
    async #navigate(route: TourRoute): Promise<boolean> {
        if (page.route.id === route) {
            return true;
        }

        try {
            await goto(route === '/settings' ? resolve('/settings') : resolve('/tracker'));
        } catch {
            return false;
        }
        await tick();

        // The settings page cancels navigation while it has unsaved changes.
        return page.route.id === route;
    }

    async #createDriver() {
        if (this.#driver) {
            return;
        }

        const { driver } = await import('driver.js');
        this.#driver = driver({
            steps: TOUR_STEPS.map(toDriveStep),
            showProgress: true,
            popoverClass: 'tht-tour',
            smoothScroll: true,
            // Read-only: the highlighted part of the app can be looked at but not used.
            disableActiveInteraction: true,
            // A stray click on the dimmed page shouldn't end the tour; X and Escape do.
            overlayClickBehavior: 'none',
            // Gives a page or dialog that is still rendering a moment to show the element.
            waitForElement: 2000,
            onNextClick: () => void this.#go(this.#index + 1, 1),
            onPrevClick: () => void this.#go(this.#index - 1, -1),
            // Fires for the X button and Escape (and for our own destroy, which #silent filters out).
            onDestroyed: () => {
                if (!this.#silent) {
                    this.#end(true);
                }
            }
        });
    }

    /** Moves to `index`, or past it in `direction` if that step is optional and has nothing to show. */
    async #go(index: number, direction: 1 | -1) {
        if (this.#busy || !this.active || !this.#driver) {
            return;
        }

        this.#busy = true;
        try {
            const target = await this.#reach(index, direction);
            if (target === undefined) {
                return;
            }

            this.#index = target;
            sessionStorage.setItem(STORAGE_KEY, String(target));
            this.#driver.moveTo(target);
        } finally {
            this.#busy = false;
        }
    }

    /**
     * Gets the app ready for the step at `index` and returns the step to show,
     * stepping past optional ones with nothing on the page. Returns undefined
     * when there is nothing to show: before the first step, after the last (which
     * ends the tour), closed while getting ready, or the page couldn't be reached.
     */
    async #reach(index: number, direction: 1 | -1): Promise<number | undefined> {
        for (let i = index; i >= 0; i += direction) {
            if (i >= TOUR_STEPS.length) {
                this.#end(true);
                return undefined;
            }

            const step = TOUR_STEPS[i];
            const ready = await this.#prepare(step);
            // Closed with X or Escape while the page was getting ready.
            if (!this.active) {
                return undefined;
            }
            if (!ready) {
                // Couldn't reach the step's page. Stay on the current step, or
                // give up quietly if the tour hadn't shown anything yet.
                if (!this.#driver?.isActive()) {
                    this.#end(false);
                }
                return undefined;
            }

            if (!isMissing(step)) {
                return i;
            }
        }

        return undefined;
    }

    /** Gets the app into the state `step` needs. False if its page couldn't be reached. */
    async #prepare(step: TourStep): Promise<boolean> {
        // Close whichever dialog the previous step had open, unless this step is in it too.
        if (this.#closeDialogs(step.dialog)) {
            await tick();
            await sleep(DIALOG_SETTLE_MS);
        }

        if (!(await this.#navigate(step.route))) {
            return false;
        }

        if (step.dialog && !this.dialogs[step.dialog]) {
            this.dialogs[step.dialog] = true;
            await tick();
            await sleep(DIALOG_SETTLE_MS);
        }

        return true;
    }

    /** Closes every dialog except `keep`. True if one was open. */
    #closeDialogs(keep?: TourDialog): boolean {
        let closedAny = false;
        for (const name of Object.keys(this.dialogs) as TourDialog[]) {
            if (name !== keep && this.dialogs[name]) {
                this.dialogs[name] = false;
                closedAny = true;
            }
        }
        return closedAny;
    }

    /** Takes the tour off screen. `markSeen` records it on the account so it won't auto-start again. */
    #end(markSeen: boolean) {
        if (!this.active) {
            return;
        }

        this.active = false;
        this.#closeDialogs();
        sessionStorage.removeItem(STORAGE_KEY);

        this.#silent = true;
        this.#driver?.destroy();
        this.#silent = false;

        if (markSeen) {
            this.#seen = true;
            // If this fails the tour simply shows again next visit.
            fetch(resolve('/tour/complete'), { method: 'POST' }).catch(() => {});
        }
    }
}

export const tour = new Tour();
