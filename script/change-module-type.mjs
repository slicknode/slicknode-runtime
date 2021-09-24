import * as fs from 'fs';
import * as path from 'path';

// Hack to change module type in package.json, so Mocha tests don't fail
// with ESM imports:
(async () => {
  const [node, script, type] = process.argv;

  const file = path.resolve(path.join(path.dirname(''), 'package.json'));
  const content = JSON.parse(fs.readFileSync(file).toString());
  const newContent = JSON.stringify({ ...content, type }, null, 2);
  fs.writeFileSync(file, newContent + '\n');
})();
