import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resolveLocalPlugin = async (pluginName) => {
  const candidateRoots = [__dirname, path.join(__dirname, '..')];
  for (const root of candidateRoots) {
    const candidate = path.join(root, 'node_modules', pluginName);
    if (fs.existsSync(candidate)) {
      return import(pathToFileURL(candidate));
    }
  }
  return import(pluginName);
};

const [{ default: tailwindcss }, { default: autoprefixer }] = await Promise.all([
  resolveLocalPlugin('tailwindcss'),
  resolveLocalPlugin('autoprefixer'),
]);

export default {
  plugins: {
    tailwindcss,
    autoprefixer,
  },
};
