import * as fs from 'fs';
import * as path from 'path';
import { SpecType } from './createSpec';
const chalk = require('chalk');

export function clearSpec(files: SpecType[]) {
  files.forEach((file) => {
    const targetUrl = path.join(file.dir, `${file.name}.spec.ts`);


    if (fs.existsSync(targetUrl)) {
      fs.unlinkSync(targetUrl);
      console.log(chalk.red('delete ') + targetUrl);
    }
  });
}
