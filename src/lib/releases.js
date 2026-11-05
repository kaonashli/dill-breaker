// Release notes shown in the app on the "What's new" page.
// Newest first. Keep these short and friendly - they're for players, not developers.
// (The technical version lives in CHANGELOG.md.)
//
// When you release: add a new entry at the TOP and bump "version" in package.json.
export const RELEASES = [
  {
    version: '0.4.0',
    date: '2026-11-05',
    title: 'Photos, stories & your own paddle',
    notes: [
      'Give your games and matches a title and description. New ones start with a punny title based on the time of day (tap the dice button for another).',
      'Add up to 5 photos to a game or match. In the activity feed, swipe sideways to see them all.',
      'Keep private notes on any game. Only you can ever see them.',
      'Tap any game in the activity feed to see all the details and photos.',
      "Tap a player's name in the feed to visit their profile and add them as a friend.",
      'The feed shows a little court for singles or doubles, indoor or outdoor (with a sun or moon).',
      'Pick your paddle color in your settings. It shows on your profile and on your play calendar.',
      'The play calendar court got a makeover: grass on the sides, a lighter kitchen, and a court you can see through the net.',
      "What's new can now be opened without logging in.",
    ],
  },
  {
    version: '0.3.0',
    date: '2026-11-05',
    title: 'Notifications & a pickleball makeover',
    notes: [
      "Know right away when someone wants to be friends: a red badge, a pop-up and a paddle-hit sound. (You can turn the sound off on your Profile.)",
      'Your play calendar now looks like a pickleball net, with a ball on every day you played.',
      'A brand new pickle logo.',
      'The Games tab on your phone now has a paddle icon.',
      'Friend requests now show up on your phone without refreshing.',
      "This What's new page, so you can see what changed in each update.",
      "On profiles, the play calendar is now at the top.",
    ],
  },
  {
    version: '0.2.0',
    date: '2026-11-05',
    title: 'Profiles & activity feed',
    notes: [
      'Every player has a profile page with their stats, your record against them, and their play calendar.',
      'New Activity feed: see the latest games and matches from you and your friends.',
      "Feels like an app on your phone, with a new bottom menu. You can even add it to your home screen.",
      'Dark mode is now the default.',
      "Better privacy: only your friends and people you've played with can see your profile.",
    ],
  },
  {
    version: '0.1.0',
    date: '2026-11-03',
    title: 'First release',
    notes: [
      'Create an account with your own photo.',
      'Log single games or whole matches.',
      "Add friends, plus up to 5 pickle pals for friends who don't have an account.",
      'A dashboard of your stats that you can rearrange and compare with friends.',
    ],
  },
]

export const CURRENT_VERSION = RELEASES[0].version

// Has this person seen the latest release notes yet? (remembered per device)
const SEEN_KEY = 'lastSeenRelease'
export function hasUnseenRelease() {
  try {
    return localStorage.getItem(SEEN_KEY) !== CURRENT_VERSION
  } catch {
    return false
  }
}
export function markReleaseSeen() {
  try {
    localStorage.setItem(SEEN_KEY, CURRENT_VERSION)
  } catch {
    /* ignore */
  }
}
