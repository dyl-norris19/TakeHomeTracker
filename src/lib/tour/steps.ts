// The intro tour, in order. All of the wording lives here.
//
// `element` is a CSS selector for a `data-tour="..."` attribute in the app; a
// step without one shows as a centred popover. Text is rendered as HTML.

export type TourRoute = '/tracker' | '/settings';

/** The dialogs the tour opens and closes itself. */
export type TourDialog = 'new-card' | 'new-goal' | 'adjust-goal';

export type TourStep = {
    route: TourRoute;
    element?: string;
    title: string;
    description: string;
    side?: 'top' | 'right' | 'bottom' | 'left';
    align?: 'start' | 'center' | 'end';
    /** Shown inside this dialog, which the tour opens for the step and closes after. */
    dialog?: TourDialog;
    /** Skipped when its element isn't on the page. */
    optional?: boolean;
    /**
     * Points at the button that leads to the next step's page. The button is
     * clickable, and clicking it carries the tour on (Next does the same).
     */
    nav?: boolean;
};

export const TOUR_STEPS: TourStep[] = [
    {
        route: '/tracker',
        title: 'Welcome to TakeHome Tracker!',
        description:
            'This quick tour shows how everything fits together. Anything you haven’t set up yet is filled in with examples for now.'
    },
    {
        route: '/tracker',
        element: '[data-tour="card"]',
        title: 'Cards',
        description:
            'Each card is one paycheck. It starts with your pay, subtracts your bills, sets aside savings, and what is left is your <strong>take home</strong>: the money you can spend on whatever!',
        side: 'left',
        align: 'start'
    },
    {
        route: '/tracker',
        nav: true,
        element: '[data-tour="nav-settings"]',
        title: 'Settings live here',
        description:
            'Before your first card there are a couple of things to set up. <strong>Click the gear</strong> to open Settings.',
        side: 'bottom',
        align: 'end'
    },
    {
        route: '/settings',
        element: '[data-tour="pay-schedule"]',
        title: 'Set your pay schedule first',
        description:
            'Tell the app how often and when you get paid. New cards are dated and prefilled from this, so you can’t create a card until it’s saved.',
        side: 'bottom',
        align: 'start'
    },
    {
        route: '/settings',
        element: '[data-tour="recurring-bills"]',
        title: 'Recurring bills',
        description:
            'Add the bills that come out every month, as a flat amount or a percent of your pay. Give a bill a due day to put it on the one paycheck that covers it, or split it across every paycheck. They’re filled in on new cards for you.',
        side: 'top',
        align: 'start'
    },
    {
        route: '/settings',
        nav: true,
        element: '[data-tour="nav-tracker"]',
        title: 'Back to your cards',
        description: '<strong>Click Tracker</strong> to go back to your cards and goals.',
        side: 'bottom',
        align: 'end'
    },
    {
        route: '/tracker',
        element: '[data-tour="new-card"]',
        title: 'Adding a card',
        description: 'When a paycheck comes in, add a card for it here. Let’s look at what’s inside.',
        side: 'right',
        align: 'start'
    },
    {
        route: '/tracker',
        dialog: 'new-card',
        element: '[data-tour="card-basics"]',
        title: 'Basics',
        description:
            'Pick which paycheck this is and how much you were paid. The pay date comes from your pay schedule.',
        side: 'right',
        align: 'start'
    },
    {
        route: '/tracker',
        dialog: 'new-card',
        element: '[data-tour="card-recurring-bills"]',
        title: 'Recurring bills',
        description:
            'The bills from Settings that fall on this paycheck show up here automatically. You can adjust an amount for just this card.',
        side: 'right',
        align: 'start'
    },
    {
        route: '/tracker',
        dialog: 'new-card',
        element: '[data-tour="card-other-bills"]',
        title: 'Other bills',
        description: 'One-off costs for this paycheck only, like a car repair or groceries.',
        side: 'right',
        align: 'start'
    },
    {
        route: '/tracker',
        dialog: 'new-card',
        element: '[data-tour="card-savings"]',
        title: 'Savings or allowance',
        description:
            '<strong>Splurge</strong>: choose how much to save, and the rest is your take home. <strong>Save</strong>: choose an allowance to spend, and the rest goes to savings. Either one can be a percent of your pay or a flat amount.',
        side: 'right',
        align: 'start'
    },
    {
        route: '/tracker',
        dialog: 'new-card',
        optional: true,
        element: '[data-tour="card-goals"]',
        title: 'Put toward goals',
        description:
            'Send part of this card’s savings to your goals. Anything you don’t assign stays as general savings.',
        side: 'right',
        align: 'start'
    },
    {
        route: '/tracker',
        dialog: 'new-card',
        element: '[data-tour="card-notes"]',
        title: 'Notes',
        description: 'Anything you want to remember about this paycheck. Optional.',
        side: 'right',
        align: 'start'
    },
    {
        route: '/tracker',
        element: '[data-tour="new-goal"]',
        title: 'Goals',
        description:
            'A goal is something you’re saving up for. Create your goals <strong>before</strong> you make a card: a card can only put money toward goals that already exist.',
        side: 'right',
        align: 'start'
    },
    {
        route: '/tracker',
        dialog: 'new-goal',
        element: '[data-tour="new-goal-dialog"]',
        title: 'Creating a goal',
        description:
            'Give it a name and a target amount. If you’ve already put some money aside for it, enter that too so the goal starts from there.',
        side: 'right',
        align: 'start'
    },
    {
        route: '/tracker',
        element: '[data-tour="goal"]',
        title: 'Tracking a goal',
        description:
            'Each goal shows how much you’ve saved toward its target. It grows whenever a card puts money toward it, starting from any amount you already had when you created it.',
        side: 'right',
        align: 'start'
    },
    {
        route: '/tracker',
        element: '[data-tour="goal-actions"]',
        title: 'Managing a goal',
        description:
            'Use <strong>±</strong> to add or take out money that didn’t come from a paycheck, and the <strong>pencil</strong> to rename it or change the target. When you’re done funding a goal, <strong>Close</strong> it so new cards stop offering it. You can reopen it any time.',
        side: 'right',
        align: 'start'
    },
    {
        route: '/tracker',
        dialog: 'adjust-goal',
        element: '[data-tour="adjust-goal-dialog"]',
        title: 'Adjusting a goal',
        description:
            'Pick <strong>+</strong> to add money or <strong>−</strong> to take some out, enter the amount, and add a note if you like. Every adjustment is listed under History, where you can remove one if it was a mistake.',
        side: 'right',
        align: 'start'
    },
    {
        route: '/tracker',
        element: '[data-tour="card-edit"]',
        title: 'Changes only affect new cards',
        description:
            'Changing your settings or goals only affects cards you make from then on. Existing cards stay exactly as they are unless you edit one directly, here.',
        side: 'left',
        align: 'start'
    },
    {
        route: '/tracker',
        title: 'That’s it!',
        description:
            'Thanks again, and enjoy. A good first move is setting your pay schedule in Settings. You can replay this tour from there any time.'
    }
];
