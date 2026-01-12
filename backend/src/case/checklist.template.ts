import { DocType } from '@prisma/client';

export const IHK_CHECKLIST_TEMPLATE = [
  {
    type: DocType.APPLICATION_FORM,
    required: true,
    note: 'Unterschrift nicht erforderlich bei digitaler Antragstellung',
  },
  {
    type: DocType.DIPLOMA_AND_SUBJECTS,
    required: true,
    translationRule: 'DE_REQUIRED',
  },
  {
    type: DocType.IDENTITY_PROOF,
    required: true,
  },
  {
    type: DocType.CV,
    required: true,
  },
  {
    type: DocType.INTENT_TO_WORK_PROOF,
    required: true,
  },
  {
    type: DocType.PROOF_WORK_EXPERIENCE,
    required: false,
    translationRule: 'DE_REQUIRED',
  },
  {
    type: DocType.OTHER_QUALIFICATIONS,
    required: false,
    translationRule: 'DE_REQUIRED',
  },
  {
    type: DocType.TRAINING_CURRICULUM,
    required: false,
    translationRule: 'SPECIAL_LANGUAGE_RULE',
  },
];
