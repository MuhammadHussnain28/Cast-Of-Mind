import { useSelector } from 'react-redux'
import { Heading, Text } from '../../components/ui'
import SignOutButton from '../../components/auth/SignOutButton'
import { selectUser } from '../../store/authSlice'

/**
 * Placeholder. The admin portal is slice 4 onwards; this exists so the
 * role-based redirect and the admin-only guard can be verified.
 */
export default function Admin() {
  const user = useSelector(selectUser)

  return (
    <section className="mx-auto w-full max-w-measure px-4 py-16 sm:py-24">
      <Heading level={1} size="section">
        Admin
      </Heading>

      <Text tone="muted" className="mt-4">
        Signed in as {user?.email} ({user?.role}).
      </Text>

      <Text className="mt-6">
        This is a placeholder. Applications, therapists, clients and the dashboard arrive
        in later chunks.
      </Text>

      <div className="mt-10">
        <SignOutButton />
      </div>
    </section>
  )
}
