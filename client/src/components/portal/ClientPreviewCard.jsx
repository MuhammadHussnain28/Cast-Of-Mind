import { Text } from '../ui'
import TherapistIdentity from '../therapist/TherapistIdentity'

/**
 * The therapist as a client meets them, presented on a dark stage.
 *
 * This is the page's central idea rather than decoration. A therapist editing a
 * "bio" field in a form has no way of knowing what it is for; seeing the actual
 * card someone reads while choosing a therapist makes the two editable fields
 * obviously worth care. Show the thing, do not describe it.
 *
 * The card is `paper` on `ink` so it reads as an object being presented —
 * the same dark-band language the admin portal uses for the subject of a page,
 * warmer here because §24.8 says the portals run warmer than admin.
 */
export default function ClientPreviewCard({ profile }) {
  return (
    <section
      data-surface="dark"
      aria-labelledby="client-view"
      className="relative overflow-hidden rounded-3xl bg-ink px-5 py-6 sm:px-8 sm:py-8"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 -top-24 size-72 rounded-full bg-sage/10 blur-[130px]"
      />

      <div className="relative">
        <h2 id="client-view" className="font-body text-caption text-paper/70">
          How you appear to someone choosing a therapist
        </h2>

        <div className="mt-5 rounded-2xl bg-paper px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-wrap items-start gap-4 sm:flex-nowrap">
            {profile.photoUrl && (
              <img
                src={profile.photoUrl}
                alt=""
                className="size-20 shrink-0 rounded-full object-cover"
              />
            )}

            {/* THE SAME COMPONENT THE CLIENT-FACING CARD USES. This card is
                captioned "how you appear to someone choosing a therapist", and
                that caption is only true while both are built from one source.
                Chunk 5.6 extracted it for exactly that reason. */}
            <div className="min-w-0">
              <TherapistIdentity therapist={profile} headingLevel={3} />
            </div>
          </div>

          <Text className="mt-5 whitespace-pre-line">{profile.bio}</Text>
        </div>

        <Text size="caption" className="mt-4 text-paper/70">
          Your photo and bio are yours to change. Everything else on this card was verified
          when your application was approved.
        </Text>
      </div>
    </section>
  )
}
