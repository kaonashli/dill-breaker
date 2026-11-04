import PlayCalendar from './PlayCalendar'
import WinLoss from './WinLoss'
import PointsPerGame from './PointsPerGame'
import PlayPartners from './PlayPartners'
import Chemistry from './Chemistry'
import SinglesDoubles from './SinglesDoubles'

// Every widget the dashboard knows about. The ids are what get saved in
// user_settings.widgets. To add a new widget: make a component that takes
// { players, stats, colors } and add it here.
export const WIDGETS = {
  play_calendar: { title: 'Play calendar', component: PlayCalendar },
  win_loss: { title: 'Wins vs losses', component: WinLoss },
  points_per_game: { title: 'Points per game', component: PointsPerGame },
  play_partners: { title: 'Who you play with', component: PlayPartners },
  chemistry: { title: 'Chemistry', component: Chemistry },
  singles_vs_doubles: { title: 'Singles vs doubles', component: SinglesDoubles },
}

export const DEFAULT_WIDGETS = Object.keys(WIDGETS)
