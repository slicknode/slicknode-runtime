import * as fs from 'fs';
import * as path from 'path';

// Hack to change module type in package.json, so Mocha tests don't fail
// with ESM imports:
(async () => {
  const [node, script, type] = process.argv;
  console.log('Arg', type);
  if (!type) {
    throw new Error('No module type provided as arg');
  }

  const content = JSON.parse(
    fs
      .readFileSync(path.resolve(path.join(path.dirname(''), 'package.json')))
      .toString()
  );
  const newContent = JSON.stringify({ ...content, type }, null, 2);
})();
