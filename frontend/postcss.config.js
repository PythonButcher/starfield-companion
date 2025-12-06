import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const resolveLocalPlugin = (pluginName) => {
  const candidateRoots = [__dirname, path.join(__dirname, '..')];
  for (const root of candidateRoots) {
    const candidate = path.join(root, 'node_modules', pluginName);
    if (fs.existsSync(candidate)) {
      return require(candidate);
    }
  }
  return require(pluginName);
};

export default {
  plugins: {
    tailwindcss: resolveLocalPlugin('tailwindcss'),
    autoprefixer: resolveLocalPlugin('autoprefixer'),
  },
};
