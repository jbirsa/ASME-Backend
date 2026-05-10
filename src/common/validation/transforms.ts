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

export function ToNormalizedEmail() {
  return Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  );
}

export function ToInteger() {
  return Type(() => Number);
}
