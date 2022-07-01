function splitString(str: string): string[] {
  const normalized = str
    // sanitize characters that cannot be included
    .replace(/[!@#$%^&*]/g, '')
    // break apart camelCasing
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    // normalize separators to '-'
    .replace(/[._/\s\\]/, '-');
  return normalized.split('-');
}
function capitalizeFirstLetter(segment: string): string {
  return segment[0].toUpperCase() + segment.slice(1);
}
function lowercaseFirstLetter(segment: string): string {
  return segment[0].toLowerCase() + segment.slice(1);
}
function toKebab(str: string): string {
  return splitString(str).join('-').toLowerCase();
}
function toPascal(str: string): string {
  return splitString(str).map(capitalizeFirstLetter).join('');
}
function toCamel(str: string): string {
  return lowercaseFirstLetter(toPascal(str));
}
function toEnv(str: string): string {
  return splitString(str).join('_').toUpperCase();
}
export { capitalizeFirstLetter, toKebab, toCamel, toPascal, toEnv };
