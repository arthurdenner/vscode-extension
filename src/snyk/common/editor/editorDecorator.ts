import { IThemeColorAdapter } from '../vscode/theme';
import { TextEditorDecorationType, ThemableDecorationInstanceRenderOptions } from '../vscode/types';
import { IVSCodeWindow } from '../vscode/window';
import { LineDecorations } from './types';

export function updateDecorations(
  window: IVSCodeWindow,
  filePath: string,
  decorations: LineDecorations,
  decorationType: TextEditorDecorationType,
): void {
  const visibleEditors = window.getVisibleTextEditors().filter(editor => editor.document.fileName === filePath);
  for (const editor of visibleEditors) {
    if (decorations && decorations.length) {
      editor.setDecorations(
        decorationType,
        decorations.filter(d => !!d).filter(({ renderOptions }) => renderOptions?.after?.contentText),
      );
    }
  }
}

export function getRenderOptions(
  contentText: string,
  themeColorAdapter: IThemeColorAdapter,
): ThemableDecorationInstanceRenderOptions {
  const color = themeColorAdapter.create('descriptionForeground');
  const fontWeight = 'normal';

  return {
    after: {
      contentText,
      color,
      fontWeight,
    },
  };
}
