import { useSelector } from 'react-redux'
import { Heading, Text } from '../../components/ui'
import SignOutButton from '../../components/auth/SignOutButton'
import { selectUser } from '../../store/authSlice'

/**
 * Placeholder. Chunk 1.6 builds the ROUTE and the guard around it, not the
 * portal itself — client portal content is slice 7, therapist portal slice 8.
 *
 * It shows the signed-in email and role only so the redirect can be seen
 * working by eye.
 */
export default function Portal() {
  const user = useSelector(selectUser)

  return (
    <section className="mx-auto w-full max-w-measure px-4 py-16 sm:py-24">
      <Heading level={1} size="section">
        Your portal
      </Heading>

      <Text tone="muted" className="mt-4">
        Signed in as {user?.email} ({user?.role}).
      </Text>

      <Text className="mt-6">
        This is a placeholder. Chat, worksheets, your journal and your sessions arrive in
        later chunks.
      </Text>

      <div className="mt-10">
        <SignOutButton />
      </div>
    </section>
  )
}
