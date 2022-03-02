import npmValidPackageName from 'validate-npm-package-name';
import { BabelParser } from '../../snykOss/services/vulnerabilityCount/parsers/babelParser';
import { HtmlParser } from '../../snykOss/services/vulnerabilityCount/parsers/htmlParser';
import { ModuleParser } from '../../snykOss/services/vulnerabilityCount/parsers/moduleParser';
import { PackageJsonParser } from '../../snykOss/services/vulnerabilityCount/parsers/packageJsonParser';
import nativeModules from '../constants/nativeModules';
import { ILog } from '../logger/interfaces';
import { ImportedModule, Language } from '../types';
import {
  HTML,
  HTML_FILE_REGEX,
  JAVASCRIPT,
  JAVASCRIPT_FILE_REGEX,
  JAVASCRIPT_REACT,
  PJSON,
  TYPESCRIPT,
  TYPESCRIPT_FILE_REGEX,
  TYPESCRIPT_REACT,
} from './languageConsts';

export function getInstance(language: Language, logger: ILog): ModuleParser | undefined {
  if ([Language.TypeScript, Language.JavaScript].includes(language)) {
    return new BabelParser();
  } else if (language === Language.PJSON) {
    return new PackageJsonParser(logger);
  } else if (language === Language.HTML) {
    return new HtmlParser();
  }

  return undefined;
}

export function getModules(fileName: string, source: string, language: Language, logger: ILog): ImportedModule[] {
  const parser = getInstance(language, logger);
  if (!parser) {
    return [];
  }

  return parser.getModules(fileName, source, language);
}

export function getSupportedLanguage(fileName: string, languageId: string): Language | null {
  if (languageId === TYPESCRIPT || languageId === TYPESCRIPT_REACT || TYPESCRIPT_FILE_REGEX.test(fileName)) {
    return Language.TypeScript;
  } else if (languageId === JAVASCRIPT || languageId === JAVASCRIPT_REACT || JAVASCRIPT_FILE_REGEX.test(fileName)) {
    return Language.JavaScript;
  } else if (languageId === HTML || HTML_FILE_REGEX.test(fileName)) {
    return Language.HTML;
  } else if (languageId === PJSON && fileName.endsWith('package.json')) {
    return Language.PJSON;
  }

  return null;
}

export function isValidModuleName(module: ImportedModule): boolean {
  const moduleName = module.name;
  if (nativeModules.includes(moduleName.toLowerCase())) {
    return false;
  }

  if (moduleName.trim() == '' || /^[.~]/.test(moduleName)) {
    return false;
  }

  if (moduleName.includes('/') && !moduleName.startsWith('@')) {
    const newName = module.name.split('/').shift();
    if (newName) {
      // mutating…
      module.name = newName;
    } else {
      return false;
    }
  }

  const valid = npmValidPackageName(module.name);
  if (valid.errors) {
    // invalid package name, so isn't real, so we'll bail
    return false;
  }

  return true;
}
