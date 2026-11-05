// Punny default titles for games and matches, based on the time of day played.
// One is picked at random; the 🎲 button in the form picks another.

const TITLES = {
  earlyMorning: [ // 5am - 8am
    'Rise and Dink',
    'Early Bird Gets the Dink',
    'Dawn of the Dill',
    'Sunrise Smash Session',
    'Coffee, Then Kitchen',
  ],
  morning: [ // 8am - 12pm
    'Morning Pickle Party',
    'Dill-icious Morning',
    'Brunch & Bangers',
    'Good Morning, Kitchen',
    'A.M. Dinkin\'',
  ],
  midday: [ // 12pm - 2pm
    'Lunchtime Lob-ster',
    'Dink & Dine',
    'Pickle on Rye',
    'Noon Kitchen Duel',
    'Lunch Break Banger',
  ],
  afternoon: [ // 2pm - 5pm
    'Afternoon Delight (Dink Edition)',
    'Big Dill Energy',
    'Sunny Side Smash',
    'Paddle Battle Afternoon',
    'Third Shot Siesta',
  ],
  evening: [ // 5pm - 9pm
    'Golden Hour Dinks',
    'After-Work Pickle Fix',
    'Dinner & Dinks',
    'Sunset Smashdown',
    'Evening Kitchen Raid',
  ],
  night: [ // 9pm - 5am
    'Dinks After Dark',
    'Midnight Pickling',
    'Night Court',
    'Moonlight Lob Session',
    'Late Night Dill-ema',
  ],
}

export function partOfDay(date) {
  if (Number.isNaN(date.getTime())) return 'morning' // empty / invalid date
  const h = date.getHours()
  if (h >= 5 && h < 8) return 'earlyMorning'
  if (h >= 8 && h < 12) return 'morning'
  if (h >= 12 && h < 14) return 'midday'
  if (h >= 14 && h < 17) return 'afternoon'
  if (h >= 17 && h < 21) return 'evening'
  return 'night'
}

// A random title for when the game was played. Pass `avoid` to get a different one.
export function randomTitle(date = new Date(), avoid = '') {
  const options = TITLES[partOfDay(date)].filter((t) => t !== avoid)
  return options[Math.floor(Math.random() * options.length)]
}
