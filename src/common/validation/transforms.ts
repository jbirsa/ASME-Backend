import { Transform, Type } from 'class-transformer';

export const HTTP_URL_REGEX = /^https?:\/\/[^\s]+$/i;
export const EVENT_PAGE_REGEX =
  /^(https?:\/\/[^\s]+|\/?[A-Za-z0-9][A-Za-z0-9/_-]*)$/;

export function ToTrimmedString() {
  return Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  );
}

export function ToOptionalTrimmedString() {
  return Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const trimmedValue = value.trim();
    return trimmedValue === '' ? undefined : trimmedValue;
  });
}

export function ToOptionalBoolean() {
  return Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    if (typeof value !== 'string') return value;

    const normalizedValue = value.trim().toLowerCase();
    if (normalizedValue === 'true') return true;
    if (normalizedValue === 'false') return false;

    return value;
  });
}

export function ToOptionalIntegerArray() {
  return Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;

    const rawValues = Array.isArray(value)
      ? value
      : typeof value === 'string'
        ? parseIntegerArrayString(value)
        : [value];

    return rawValues
      .filter((item) => item !== '')
      .map((item) => (typeof item === 'number' ? item : Number(item)));
  });
}

export function ToNormalizedEmail() {
  return Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  );
}

export function ToUpperTrimmedString() {
  return Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  );
}

export function ToInteger() {
  return Type(() => Number);
}

function parseIntegerArrayString(value: string) {
  const trimmedValue = value.trim();
  if (trimmedValue === '') return [];

  if (trimmedValue.startsWith('[')) {
    try {
      const parsedValue = JSON.parse(trimmedValue);
      return Array.isArray(parsedValue) ? parsedValue : [parsedValue];
    } catch {
      return trimmedValue
        .replace(/^\[/, '')
        .replace(/\]$/, '')
        .split(',')
        .map((item) => item.trim());
    }
  }

  return trimmedValue.includes(',')
    ? trimmedValue.split(',').map((item) => item.trim())
    : [trimmedValue];
}
