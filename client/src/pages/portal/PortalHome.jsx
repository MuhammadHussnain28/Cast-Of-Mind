import { useSelector } from 'react-redux'
import { Heading, Text } from '../../components/ui'
import TherapistProfile from './TherapistProfile'
import { selectRole } from '../../store/authSlice'

/**
 * `/portal` serves two roles (§5), so it branches here.
 *
 * A therapist gets their profile — the only therapist screen that exists until
 * slice 8 builds the inbox. A client still gets a placeholder; the client
 * portal is slice 7.
 */
export default function PortalHome() {
  const role = useSelector(selectRole)

  if (role === 'therapist') return <TherapistProfile />

  return (
    <div className="max-w-measure">
      <Heading level={1} size="subsection">
        Your portal
      </Heading>
      <Text tone="muted" className="mt-3">
        Chat, worksheets, your journal and your sessions arrive in a later chunk.
      </Text>
    </div>
  )
}
