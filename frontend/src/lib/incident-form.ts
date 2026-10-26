import type { Category, Impact, Urgency } from '../types';

export interface IncidentFormValues {
  title: string;
  description: string;
  category: Category | '';
  impact: Impact | '';
  urgency: Urgency | '';
}

export type IncidentFormField = keyof IncidentFormValues;
export type IncidentFormErrors = Partial<Record<IncidentFormField, string>>;

export interface CompleteIncidentForm {
  title: string;
  description: string;
  category: Category;
  impact: Impact;
  urgency: Urgency;
}

export const EMPTY_INCIDENT_FORM: IncidentFormValues = {
  title: '',
  description: '',
  category: '',
  impact: '',
  urgency: '',
};

export function validateIncidentForm(values: IncidentFormValues): IncidentFormErrors {
  const errors: IncidentFormErrors = {};
  const title = values.title.trim();
  const description = values.description.trim();

  if (title.length < 5) {
    errors.title = 'El título debe tener al menos 5 caracteres.';
  } else if (title.length > 200) {
    errors.title = 'El título no puede superar los 200 caracteres.';
  }

  if (description.length < 10) {
    errors.description = 'La descripción debe tener al menos 10 caracteres.';
  } else if (description.length > 10_000) {
    errors.description = 'La descripción no puede superar los 10000 caracteres.';
  }

  if (!values.category) errors.category = 'Selecciona una categoría.';
  if (!values.impact) errors.impact = 'Selecciona el impacto.';
  if (!values.urgency) errors.urgency = 'Selecciona la urgencia.';

  return errors;
}

export function isCompleteIncidentForm(values: IncidentFormValues): values is CompleteIncidentForm {
  return (
    values.title.trim().length >= 5 &&
    values.description.trim().length >= 10 &&
    values.category !== '' &&
    values.impact !== '' &&
    values.urgency !== ''
  );
}

const FORM_FIELDS: readonly IncidentFormField[] = [
  'title',
  'description',
  'category',
  'impact',
  'urgency',
];

export function mapIncidentFormFieldErrors(
  fieldErrors: Record<string, string>,
): IncidentFormErrors {
  const errors: IncidentFormErrors = {};

  for (const field of FORM_FIELDS) {
    const message = fieldErrors[field];
    if (message) errors[field] = message;
  }

  return errors;
}
