export type DomainErrorCode =
  | 'INVALID_STATUS_TRANSITION'
  | 'INVALID_INCIDENT_STATE'
  | 'ASSIGNEE_REQUIRED';

export class DomainError extends Error {
  public readonly code: DomainErrorCode;

  constructor(code: DomainErrorCode, message: string) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
  }
}
