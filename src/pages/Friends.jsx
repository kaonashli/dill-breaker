import { usePeople } from '../lib/people'
import FriendsPanel from '../components/FriendsPanel'
import PicklePalsPanel from '../components/PicklePalsPanel'

// On phones, friends + pickle pals get their own tab instead of the dashboard sidebar
export default function Friends() {
  const people = usePeople()
  return (
    <div className="narrow stack">
      <h1>Friends</h1>
      <FriendsPanel people={people} />
      <PicklePalsPanel people={people} />
    </div>
  )
}
