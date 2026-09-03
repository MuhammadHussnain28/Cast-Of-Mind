import { useWatch } from 'react-hook-form'
import { Textarea } from '../ui'
import YesNoField from './YesNoField'
import DocumentUpload from './DocumentUpload'
import { Lock } from './JoinIcons'

/** Step 5 — 5 fields, 3 mandatory and 2 optional. */
export default function StepComplianceDocuments({ register, control, errors, setValue }) {
  // Every watched field is read here, at the top level. Reading one inside a
  // render prop would be a hook called conditionally.
  const [
    insurance,
    certificateUrl1,
    certificatePublicId1,
    certificateUrl2,
    certificatePublicId2,
    licenseDocUrl,
    licenseDocPublicId,
  ] = useWatch({
    control,
    name: [
      'malpracticeInsurance',
      'certificateUrl1',
      'certificatePublicId1',
      'certificateUrl2',
      'certificatePublicId2',
      'licenseDocUrl',
      'licenseDocPublicId',
    ],
  })

  // Each upload writes two fields at once — the URL the applicant submits, and
  // the Cloudinary id slice 4 needs to sign a viewing link for the admin.
  const setDocument =
    (urlField, idField) =>
    ({ url, publicId }) => {
      setValue(urlField, url, { shouldValidate: true, shouldDirty: true })
      setValue(idField, publicId, { shouldDirty: true })
    }

  return (
    <div className="space-y-8">
      <YesNoField
        name="malpracticeInsurance"
        legend="Do you hold professional malpractice liability insurance?"
        hint="Meeting the minimum cover for the country you practise in."
        value={insurance}
        register={register}
        error={errors.malpracticeInsurance?.message}
        reassurance={
          insurance === 'no'
            ? 'You can still apply. Our team will talk to you about cover before any client is matched.'
            : undefined
        }
      />

      <Textarea
        label="Insurance details"
        rows={3}
        placeholder="Provider, policy number, and the level of cover."
        helper="Optional. Adding it now saves a follow-up email later."
        error={errors.insuranceDetails?.message}
        {...register('insuranceDetails')}
      />

      <div className="space-y-5">
        <div>
          <h3 className="font-body text-subsection font-medium text-ink">Your documents</h3>
          <p className="mt-1 max-w-measure font-body text-caption leading-relaxed text-ink/70">
            PDF or a clear photograph. Up to 10&nbsp;MB each.
          </p>
        </div>

        <DocumentUpload
          id="certificate-1"
          label="Qualification certificate"
          kind="certificate"
          required
          helper="The degree or diploma that meets the eligibility requirement."
          value={certificateUrl1}
          publicId={certificatePublicId1}
          onChange={setDocument('certificateUrl1', 'certificatePublicId1')}
          error={errors.certificateUrl1?.message}
        />

        <DocumentUpload
          id="certificate-2"
          label="Second certificate"
          kind="certificate"
          helper="Any further qualification you would like reviewed."
          value={certificateUrl2}
          publicId={certificatePublicId2}
          onChange={setDocument('certificateUrl2', 'certificatePublicId2')}
          error={errors.certificateUrl2?.message}
        />

        <DocumentUpload
          id="license-doc"
          label="Licence document"
          kind="license"
          helper="Your practising licence, if your country issues one."
          value={licenseDocUrl}
          publicId={licenseDocPublicId}
          onChange={setDocument('licenseDocUrl', 'licenseDocPublicId')}
          error={errors.licenseDocUrl?.message}
        />
      </div>

      <p className="flex items-start gap-2.5 rounded-2xl bg-mist/60 p-4 font-body text-caption leading-relaxed text-ink/70">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sage-deep" />
        <span>
          Your documents are stored privately. Their links do not work on their own — only our
          review team can open them, and clients never see them.
        </span>
      </p>
    </div>
  )
}
