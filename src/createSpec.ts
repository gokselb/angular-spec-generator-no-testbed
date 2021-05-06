import * as fs from 'fs';
import * as path from 'path';
import * as format from 'string-template';
const chalk = require('chalk');

export interface SpecType {
  type: string;
  name: string;
  dir: string;
  url: string;
  underTest: boolean;
}

export const createSpec = async (array: SpecType[], isforce: boolean) => {
  for (const file of array) {
    // console.log(file);
    // console.log(fs.readFileSync('./template/component.template').toString());
    let targetUrl = path.join(file.dir, `${file.name}.spec.ts`);
    if (file.underTest) {
      if (!fs.existsSync(path.join(file.dir, 'tests'))) {
        fs.mkdirSync(path.join(file.dir, 'tests'));
      }
      targetUrl = path.join(file.dir, `tests/${file.name}.spec.ts`);
    }

    if (!fs.existsSync(targetUrl) || isforce) {
      const template = fs
        .readFileSync(path.join(__dirname, `template/${file.type}.template`))
        .toString();
      const fileContext = fs.readFileSync(file.url).toString();

      const className = getClassName(fileContext);

      if (className) {
        const noTypeName = file.name.replace(`.${file.type}`, '');

        const parameters = findParameters(fileContext);

        const imports: string = parameters.imports.length
          ? parameters.imports.join('\n') + '\n'
          : null;
        const lets: string = parameters.lets.length
          ? parameters.lets.map((val) => '  ' + val).join('\n') + '\n'
          : null;
        const assigns: string = parameters.assigns.length
          ? parameters.assigns.map((val) => '    ' + val).join('\n') + '\n'
          : null;
        const params: string = parameters.params.length
          ? parameters.params.join(', ')
          : null;
        const content = format(template, {
          bigName: className,
          name: file.name,
          imports,
          lets,
          assigns,
          params,
          underTest: file.underTest ? '../' : '',
        });
        await createFile(targetUrl, content);
        console.log(chalk.green('create ') + targetUrl);
      }
    }
  }
};

function findParameters(
  fileContext: string
): {
  imports: string[];
  lets: string[];
  assigns: string[];
  params: string[];
} {
  const result = {
    imports: [],
    lets: [],
    assigns: [],
    params: [],
  };
  const constructorMatch = fileContext.match(/constructor\(([\S\s]*?){/g);
  if (constructorMatch) {
    console.log();
    console.log();
    console.log();
    console.log(constructorMatch[0]);
    const parameters = constructorMatch[0].match(/(private|public|_)(.*)\s|,/g);
    const classes: string[] = [];
    if (parameters) {
      if (parameters.length > 1) {
        parameters.forEach((parameter) => {
          const split = parameter.split(':');
          classes.push(split[split.length - 1]);
        });
      } else {
        parameters.forEach((parameterLine) => {
          parameterLine.split(',').forEach((parameter) => {
            const split = parameter.split(':');
            classes.push(split[split.length - 1]);
          });
        });
      }
      classes.forEach((className) => {
        className = className.replace(/\,|\)/, '').trim();
        if (className) {
          switch (className) {
            case 'Router':
              result.imports.push(`import { Router } from '@angular/router';`);
              result.imports.push(`import { MockRouter } from 'testing';`);
              result.lets.push('let router: Router;');
              result.assigns.push(
                'router = new MockRouter() as any as Router;'
              );
              result.params.push('router');
              break;

            case 'DeviceDetectorService':
              result.imports.push(
                `import { DeviceDetectorService } from 'ngx-device-detector';`
              );
              result.lets.push('let deviceService: DeviceDetectorService;');
              result.assigns.push(
                'deviceService = new DeviceDetectorService(0);'
              );
              result.params.push('deviceService');
              break;

            case 'ActivatedRoute':
              result.imports.push(
                `import { ActivatedRouteStub } from 'testing';`
              );
              result.imports.push(
                `import { ActivatedRoute } from '@angular/router';`
              );

              result.lets.push('let activatedRoute: ActivatedRoute;');
              result.assigns.push(
                'activatedRoute = new ActivatedRouteStub() as any as ActivatedRoute;'
              );
              result.params.push('activatedRoute');
              break;

            default:
              result.params.push('null');

              break;
          }
        }
        console.log(className);
      });
    }
    console.log();
    console.log();
    console.log();
  }
  return result;
}

function getClassName(fileContext: string): string | boolean {
  let className: string;
  const match = fileContext.match(/export class (.*)(\s|{|<)/);
  if (match) {
    className = match[0].split(' ')[2];
    if (className.includes('<')) {
      className = className.split('<')[0];
    }
  }
  if (typeof className === 'string') {
    className = className.replace(/{|</, '');
    className = className.trim();
  }
  console.log('###', className, '###');
  return className;
}

function createFile(url, value) {
  return new Promise(async (resolve, reject) => {
    try {
      const file = fs.createWriteStream(url);
      file.write(value);
      file.end();
      file.on('close', () => {
        resolve(true);
      });
    } catch (error) {
      reject(error);
    }
  });
}

// camelize Name
function camelize(str) {
  str = ' ' + str;
  str = clearString(str);
  return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
    if (+match === 0) return ''; // or if (/\s+/.test(match)) for white spaces
    return index === 0 ? match.toLowerCase() : match.toUpperCase();
  });
}
function clearString(s) {
  const pattern = new RegExp(/[.\-_]/);
  let rs = '';
  for (let i = 0; i < s.length; i++) {
    rs = rs + s.substr(i, 1).replace(pattern, ' ');
  }
  return rs;
}
