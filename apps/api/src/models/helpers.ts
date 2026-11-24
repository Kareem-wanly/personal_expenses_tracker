/** Makes `%`, `_` and `\` in a search text match literally. */
export const escapeLike = (text: string) => text.replace(/[\\%_]/g, (char) => `\\${char}`);
