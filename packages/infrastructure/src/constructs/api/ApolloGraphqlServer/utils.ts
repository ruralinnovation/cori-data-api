// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const identity = (v: any) => v;
export const isEnvTrue = (str?: string): boolean => !!str && str.toLowerCase() === 'true';
