import { Subscription } from 'rxjs';
import { IConfiguration } from '../../common/configuration/configuration';
import { ILog } from '../../common/logger/interfaces';
import { ImportedModule, Language } from '../../common/types';
import { IVSCodeLanguages } from '../../common/vscode/languages';
import { getModules, getSupportedLanguage, isValidModuleName } from '../../common/vscode/parsing';
import { ThemeColorAdapter } from '../../common/vscode/theme';
import { Disposable, TextEditor } from '../../common/vscode/types';
import { IVSCodeWindow } from '../../common/vscode/window';
import { IVSCodeWorkspace } from '../../common/vscode/workspace';
import { ModuleVulnerabilityCountProvider } from '../../snykOss/services/vulnerabilityCount/vulnerabilityCountProvider';
import { AdvisorScore } from '../advisorTypes';
import EditorDecorator from '../editor/editorDecorator';
import AdvisorService from './AdvisorService';

export class AdvisorScoreDisposable implements Disposable {
  protected disposables: Disposable[] = [];
  protected advisorScanFinishedSubscription: Subscription;
  protected activeEditor: TextEditor | undefined;

  private readonly editorDecorator: EditorDecorator;

  constructor(
    private readonly window: IVSCodeWindow,
    private readonly languages: IVSCodeLanguages,
    private readonly advisorService: AdvisorService,
    private readonly vulnerabilityCountProvider: ModuleVulnerabilityCountProvider,
    private readonly configuration: IConfiguration,
    private readonly logger: ILog,
    private readonly workspace: IVSCodeWorkspace,
  ) {
    this.editorDecorator = new EditorDecorator(window, languages, new ThemeColorAdapter(), this.configuration);
  }

  async activate(): Promise<boolean> {
    this.activeEditor = this.window.getActiveTextEditor();
    if (this.activeEditor) {
      const { fileName, languageId } = this.activeEditor.document;
      const supportedLanguage = getSupportedLanguage(fileName, languageId);
      if (!supportedLanguage) {
        return false;
      }
      if (supportedLanguage !== Language.PJSON) {
        return false;
      }

      let modules = getModules(fileName, this.activeEditor.document.getText(), supportedLanguage).filter(
        isValidModuleName,
      );

      let scores = await this.advisorService.getScores(modules);
      this.processScores(scores, modules, fileName);
      this.disposables.push(
        this.workspace.onDidChangeTextDocument(async ev => {
          if (ev?.contentChanges.length) {
            this.editorDecorator.resetDecorations(fileName);
          }
          if (!ev.document.isDirty && getSupportedLanguage(ev.document.fileName, ev.document.languageId)) {
            modules = getModules(fileName, ev.document.getText(), supportedLanguage).filter(isValidModuleName);
            if (modules.length !== scores.length) {
              scores = await this.advisorService.getScores(modules);
            }

            this.processScores(scores, modules, fileName);
          }
        }),
        this.window.onDidChangeActiveTextEditor(async ev => {
          if (ev) {
            if (getSupportedLanguage(ev.document.fileName, ev.document.languageId)) {
              modules = getModules(fileName, ev.document.getText(), supportedLanguage).filter(isValidModuleName);
              scores = await this.advisorService.getScores(modules);
              this.processScores(scores, modules, fileName);
            }
          }
        }),
      );
    }

    return false;
  }

  processScores(scores: AdvisorScore[], modules: ImportedModule[], fileName: string): void {
    const vulnsLineDecorations: Map<string, number> = new Map<string, number>();
    modules.forEach(({ name, line }) => {
      vulnsLineDecorations.set(name, line || -1);
    });
    this.editorDecorator.addScoresDecorations(fileName, scores, vulnsLineDecorations);
  }

  dispose(): void {
    throw new Error('Method not implemented.');
  }
}
