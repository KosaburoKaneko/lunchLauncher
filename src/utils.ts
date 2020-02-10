export const envOf = (key: string): string => {
  if (key && process.env[key]) return process.env[key] as string;
  throw new Error(`環境変数 ${key} が存在しません。`);
};
