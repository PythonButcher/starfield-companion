const fs = require('fs');
const path = require('path');

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

module.exports = {
  plugins: {
    tailwindcss: resolveLocalPlugin('tailwindcss'),
    autoprefixer: resolveLocalPlugin('autoprefixer'),
  },
};
