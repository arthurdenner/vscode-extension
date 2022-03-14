import { getRenderOptions, updateDecorations } from '../../common/editor/editorDecorator';
import { HoverAdapter } from '../../common/vscode/hover';
import { IVSCodeLanguages } from '../../common/vscode/languages';
import { getMarkdownString } from '../../common/vscode/markdownString';
import { IThemeColorAdapter } from '../../common/vscode/theme';
import { DecorationOptions, Hover, TextEditorDecorationType } from '../../common/vscode/types';
import { IVSCodeWindow } from '../../common/vscode/window';
import { AdvisorScore } from '../advisorTypes';
import { messages } from '../messages';
import { IAdvisorApiClient } from '../services/advisorApiClient';

type LineDecorations = DecorationOptions[]; // array index is a line number
const { SCORE_PREFIX } = messages;
const SCORE_THRESHOLD = 0.7;

export default class EditorDecorator {
  private readonly decorationType: TextEditorDecorationType;
  private readonly editorLastCharacterIndex = Number.MAX_SAFE_INTEGER;
  private readonly fileDecorationLines: Map<string, LineDecorations> = new Map<string, LineDecorations>();

  constructor(
    private readonly window: IVSCodeWindow,
    private readonly languages: IVSCodeLanguages,
    private readonly themeColorAdapter: IThemeColorAdapter,
    private readonly advisorApiClient: IAdvisorApiClient,
  ) {
    this.decorationType = this.window.createTextEditorDecorationType({
      after: { margin: '0 0 0 1rem' },
    });
  }

  addScoresDecorations(filePath: string, scores: AdvisorScore[], lineDecorations: Map<string, number>): void {
    const decorations: LineDecorations = [];
    for (const [packageName, line] of lineDecorations) {
      if (line < 0) {
        continue;
      }

      const packageScore = scores.find(score => score && score.name === packageName);
      if (packageScore && packageScore.score < SCORE_THRESHOLD && packageScore.score > 0) {
        decorations[line] = {
          range: this.languages.createRange(
            line - 1,
            this.editorLastCharacterIndex,
            line - 1,
            this.editorLastCharacterIndex,
          ),
          renderOptions: getRenderOptions(
            `${SCORE_PREFIX} ${Math.round(packageScore.score * 100)}/100`,
            this.themeColorAdapter,
          ),
          hoverMessage: this.getHoverMessage(packageScore)?.contents,
        };
        this.fileDecorationLines.set(filePath, decorations);
      }
    }
    updateDecorations(this.window, filePath, decorations, this.decorationType);
  }

  getHoverMessage(score: AdvisorScore): Hover | null {
    if (!score) {
      return null;
    }
    const hoverAdapter = new HoverAdapter();
    const hoverMessageMarkdown = getMarkdownString(``);
    hoverMessageMarkdown.isTrusted = true;
    const hoverMessage = hoverAdapter.create(hoverMessageMarkdown);
    hoverMessageMarkdown.appendMarkdown('| |  | |  |');
    hoverMessageMarkdown.appendMarkdown('\n');
    hoverMessageMarkdown.appendMarkdown('| ---- | ---- | ---- |  :---- |');
    hoverMessageMarkdown.appendMarkdown('\n');
    Object.keys(score.labels).forEach(label => {
      hoverMessageMarkdown.appendMarkdown(`| ${label}: | | | ${score?.labels[label]} |`);
      hoverMessageMarkdown.appendMarkdown('\n');
    });
    hoverMessageMarkdown.appendMarkdown(
      `[More Details](${this.advisorApiClient.getAdvisorUrl('npm-package')}/${score.name})`,
    );

    return hoverMessage;
  }

  resetDecorations(filePath: string): void {
    const decorations: LineDecorations | undefined = this.fileDecorationLines.get(filePath);
    if (!decorations) {
      return;
    }

    const emptyDecorations = decorations.map(d => ({
      ...d,
      renderOptions: getRenderOptions('', this.themeColorAdapter),
    }));

    updateDecorations(this.window, filePath, emptyDecorations, this.decorationType);
  }
}
