/** Solo los módulos de Node que usa HU-06. Cargar @types/node completo choca con AbortSignal de React Native. */
declare module 'node:fs' {
  const fs: {
    readFileSync(path: string, encoding: 'utf8'): string;
  };
  export default fs;
}

declare module 'node:path' {
  const path: {
    resolve(...paths: string[]): string;
  };
  export default path;
}
