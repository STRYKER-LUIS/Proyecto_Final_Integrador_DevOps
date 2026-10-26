import { describe, expect, it } from 'vitest';
import {
  EMPTY_INCIDENT_FORM,
  isCompleteIncidentForm,
  mapIncidentFormFieldErrors,
  validateIncidentForm,
  type IncidentFormValues,
} from './incident-form';

function form(overrides: Partial<IncidentFormValues> = {}): IncidentFormValues {
  return { ...EMPTY_INCIDENT_FORM, ...overrides };
}

const VALID_FORM: IncidentFormValues = {
  title: 'La VPN no responde',
  description: 'Los usuarios remotos no pueden conectarse desde las 8:00.',
  category: 'NETWORK',
  impact: 'HIGH',
  urgency: 'HIGH',
};

describe('validateIncidentForm', () => {
  it('no devuelve errores para un formulario completo y válido', () => {
    expect(validateIncidentForm(VALID_FORM)).toEqual({});
  });

  it('exige título y descripción con longitudes mínimas', () => {
    const errors = validateIncidentForm(form({ title: 'VPN', description: 'Falla' }));

    expect(errors.title).toBe('El título debe tener al menos 5 caracteres.');
    expect(errors.description).toBe('La descripción debe tener al menos 10 caracteres.');
  });

  it('exige categoría, impacto y urgencia', () => {
    const errors = validateIncidentForm(
      form({ title: 'Título válido', description: 'Descripción suficientemente larga' }),
    );

    expect(errors.category).toBe('Selecciona una categoría.');
    expect(errors.impact).toBe('Selecciona el impacto.');
    expect(errors.urgency).toBe('Selecciona la urgencia.');
  });

  it('rechaza longitudes máximas excedidas', () => {
    const errors = validateIncidentForm(
      form({
        ...VALID_FORM,
        title: 'a'.repeat(201),
        description: 'b'.repeat(10_001),
      }),
    );

    expect(errors.title).toBe('El título no puede superar los 200 caracteres.');
    expect(errors.description).toBe('La descripción no puede superar los 10000 caracteres.');
  });

  it('ignora espacios al inicio y al final al validar longitudes', () => {
    expect(
      validateIncidentForm(
        form({
          ...VALID_FORM,
          title: '  VPN  ',
          description: '   Falla   ',
        }),
      ),
    ).toMatchObject({
      title: 'El título debe tener al menos 5 caracteres.',
      description: 'La descripción debe tener al menos 10 caracteres.',
    });
  });
});

describe('isCompleteIncidentForm', () => {
  it('reconoce un formulario completo', () => {
    expect(isCompleteIncidentForm(VALID_FORM)).toBe(true);
  });

  it('rechaza formularios incompletos', () => {
    expect(isCompleteIncidentForm(EMPTY_INCIDENT_FORM)).toBe(false);
    expect(isCompleteIncidentForm({ ...VALID_FORM, category: '' })).toBe(false);
    expect(isCompleteIncidentForm({ ...VALID_FORM, impact: '' })).toBe(false);
    expect(isCompleteIncidentForm({ ...VALID_FORM, urgency: '' })).toBe(false);
  });

  it('exige longitudes mínimas además de los campos de selección', () => {
    expect(isCompleteIncidentForm({ ...VALID_FORM, title: 'VPN' })).toBe(false);
    expect(isCompleteIncidentForm({ ...VALID_FORM, description: 'Falla' })).toBe(false);
  });
});

describe('mapIncidentFormFieldErrors', () => {
  it('mapea solo los campos conocidos del formulario', () => {
    expect(
      mapIncidentFormFieldErrors({
        title: 'Título inválido',
        description: 'Descripción inválida',
        category: 'Categoría inválida',
        impact: 'Impacto inválido',
        urgency: 'Urgencia inválida',
        priority: 'No aplica',
        other: 'Ignorado',
      }),
    ).toEqual({
      title: 'Título inválido',
      description: 'Descripción inválida',
      category: 'Categoría inválida',
      impact: 'Impacto inválido',
      urgency: 'Urgencia inválida',
    });
  });

  it('omite mensajes vacíos o ausentes', () => {
    expect(mapIncidentFormFieldErrors({ title: '', description: undefined as never })).toEqual(
      {},
    );
  });
});
