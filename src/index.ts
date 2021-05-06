import * as fs from 'fs';
import * as path from 'path';
import { createSpec } from './createSpec';
import { clearSpec } from './clearSpec';
import { readlinePromise } from './libs/readLinePromise';

const chalk = require('chalk');

export class App {
  constructor() {
    this.app();
  }

  async app() {
    try {
      const args = process.argv.slice(2);

      const sourceDir = args[0];

      const sourceTypes = this.getTypes(args);

      console.log(chalk.green(`from Url:  ${sourceDir}`));

      const isClear = args.find((arg) => {
        return arg.includes('--clear');
      });

      const handlerFile = this.getSholudSpec(
        this.getFileTree(sourceDir),
        sourceTypes,
        isClear
      );

      if (isClear) {
        if (
          (<string>(
            await readlinePromise(
              'this command will delete specs with you select, continue ? (y/n)'
            )
          )).toLocaleLowerCase() === 'n'
        ) {
          process.exit(0);
          return null;
        }
        clearSpec(handlerFile);
      } else {
        const isforce = args.some((arg) => {
          return arg.includes('--force');
        });

        await createSpec(handlerFile, isforce);
      }

      console.log(chalk.green('completed!'));
    } catch (err) {
      console.log(chalk.red(err));
    }
    process.exit(0);
  }

  private getTypes(args: string[]) {
    for (let i = 1; i < args.length; i++) {
      const arg = args[i];

      if (arg.includes('--type=')) {
        const types = arg.replace('--type=', '');

        const typeArray = types.split(',');

        return typeArray.map((t) => {
          switch (t) {
            case 'g':
            case 'guard':
              return 'guard';
            case 'c':
            case 'component':
              return 'component';
            case 's':
            case 'service':
              return 'service';
            case 'd':
            case 'directive':
              return 'directive';
            case 'p':
            case 'pipe':
              return 'pipe';
            default:
              const str = `
Configuration has error text, example: ${chalk.blue(
                '--type=guard,component,service'
              )}
options must be: ${chalk.green('guard ,component ,service ,directive ,pipe')} or
using alias: ${chalk.green('g, c, s, d, p')}
`;
              console.log(str);
              throw new Error('error occur, see above');
          }
        });
      }
    }
    return ['guard', 'component', 'service', 'directive', 'pipe'];
  }

  private getFileTree(sourceUrl: string) {
    const returnObj = [];
    const files = fs.readdirSync(sourceUrl);
    const underTest =
      files.filter(
        (file) =>
          file.includes('.ts') &&
          !file.includes('spec.ts') &&
          !file.includes('module.ts')
      ).length > 3;
    console.log(files.length, underTest);
    files.forEach((file) => {
      let url = path.join(sourceUrl, file);

      if (fs.lstatSync(url).isDirectory()) {
        returnObj.push(...this.getFileTree(url));
      }
      if (!(url.includes('index.ts') || url.includes('module.ts'))) {
        url = underTest ? url + 'UnderTest' : url;
        returnObj.push(url);
      }
    });

    return returnObj;
  }

  private getSholudSpec(
    array: Array<string>,
    checkArr: string[] = [],
    isClear: string
  ) {
    const newArray = [];

    array.forEach((url) => {
      console.log(url);
      const underTest = url.includes('UnderTest');
      url = url.replace('UnderTest', '');
      console.log(underTest, url);

      const file = path.parse(url);

      const condition = isClear ? true : !url.includes('.spec');

      if (file.ext === '.ts' && condition) {
        const type = checkArr.find((t) => url.includes(t));

        if (type) {
          newArray.push({
            type,
            name: file.name,
            dir: file.dir,
            url: url,
            underTest,
          });
        }
      }
    });

    return newArray;
  }
}

module.exports = new App();
