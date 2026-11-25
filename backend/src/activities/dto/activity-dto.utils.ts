export const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

// Trim surrounding whitespace on strings; leave other types for the validators to reject.
export const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;