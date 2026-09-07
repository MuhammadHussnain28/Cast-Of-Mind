import QuestionnaireFlow from '../components/questionnaire/QuestionnaireFlow'

/**
 * The intake flow (§6, §24.7). One question or one tight group per screen.
 *
 * Chunk 5.1 builds the shell only — progress, step order, back navigation and
 * the answers store. The question screens themselves are 5.2 (individual),
 * 5.3 (couple) and 5.4 (concerns and therapist preference).
 *
 * No <main> here: PublicLayout already provides the landmark.
 */
export default function Questionnaire() {
  return <QuestionnaireFlow />
}
