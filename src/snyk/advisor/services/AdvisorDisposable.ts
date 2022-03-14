import { Subscription } from 'rxjs';
import { ILog } from '../../common/logger/interfaces';
import { ImportedModule, Language } from '../../common/types';
import { IVSCodeLanguages } from '../../common/vscode/languages';
import { getModules, getSupportedLanguage, isValidModuleName } from '../../common/vscode/parsing';
import { ThemeColorAdapter } from '../../common/vscode/theme';
import { Disposable, TextDocumentChangeEvent, TextEditor } from '../../common/vscode/types';
import { IVSCodeWindow } from '../../common/vscode/window';
import { IVSCodeWorkspace } from '../../common/vscode/workspace';
import { AdvisorScore } from '../advisorTypes';
import EditorDecorator from '../editor/editorDecorator';
import { IAdvisorApiClient } from './advisorApiClient';
import AdvisorService from './advisorService';

export class AdvisorScoreDisposable implements Disposable {
  protected disposables: Disposable[] = [];
  protected advisorScanFinishedSubscription: Subscription;
  protected activeEditor: TextEditor | undefined;

  private readonly editorDecorator: EditorDecorator;

  constructor(
    private readonly window: IVSCodeWindow,
    private readonly languages: IVSCodeLanguages,
    private readonly advisorService: AdvisorService,
    private readonly logger: ILog,
    private readonly workspace: IVSCodeWorkspace,
    private readonly advisorApiClient: IAdvisorApiClient,
  ) {
    this.editorDecorator = new EditorDecorator(window, this.languages, new ThemeColorAdapter(), this.advisorApiClient);
  }

  async activate(): Promise<boolean> {
    this.activeEditor = this.window.getActiveTextEditor();
    if (!this.activeEditor) {
      return false;
    }

    const { fileName, languageId } = this.activeEditor.document;
    const supportedLanguage = getSupportedLanguage(fileName, languageId);
    if (supportedLanguage !== Language.PJSON) {
      return false;
    }

    const modules = getModules(fileName, this.activeEditor.document.getText(), supportedLanguage, this.logger).filter(
      isValidModuleName,
    );

    const scores = await this.advisorService.getScores(modules);
    this.processScores(scores, modules, fileName);
    this.disposables.push(
      this.workspace.onDidChangeTextDocument(async ev => {
        if (ev?.contentChanges.length) {
          this.editorDecorator.resetDecorations(fileName);
        }
        await this.handleEditorEvent(ev, fileName, supportedLanguage, scores);
      }),
      this.window.onDidChangeActiveTextEditor(async ev => {
        if (!ev) {
          return;
        }
        await this.handleEditorEvent(ev, fileName, supportedLanguage, scores);
      }),
    );

    return false;
  }

  async handleEditorEvent(
    ev: TextDocumentChangeEvent | TextEditor,
    fileName: string,
    supportedLanguage: Language,
    scores: AdvisorScore[],
  ): Promise<void> {
    if (ev.document.isDirty && !getSupportedLanguage(ev.document.fileName, ev.document.languageId)) {
      return;
    }

    const modules = getModules(fileName, ev.document.getText(), supportedLanguage, this.logger).filter(
      isValidModuleName,
    );
    if (modules.length !== scores.length) {
      scores = await this.advisorService.getScores(modules);
    }

    this.processScores(scores, modules, fileName);
  }

  processScores(scores: AdvisorScore[], modules: ImportedModule[], fileName: string): void {
    const vulnsLineDecorations: Map<string, number> = new Map<string, number>();
    modules.forEach(({ name, line }) => {
      vulnsLineDecorations.set(name, line || -1);
    });
    this.editorDecorator.addScoresDecorations(fileName, scores, vulnsLineDecorations);
  }

  dispose(): void {
    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}
