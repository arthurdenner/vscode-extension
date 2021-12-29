import * as vscode from 'vscode';

export type Disposable = vscode.Disposable;
export type DiagnosticCollection = vscode.DiagnosticCollection;
export type Diagnostic = vscode.Diagnostic;
export type DiagnosticSeverity = vscode.DiagnosticSeverity;
export type DocumentSelector = vscode.DocumentSelector;
export type HoverProvider = vscode.HoverProvider;
export type ProviderResult<T> = vscode.ProviderResult<T>;
export type TextEditor = vscode.TextEditor;
export type TextDocument = vscode.TextDocument;
export type Position = vscode.Position;
export type Range = vscode.Range;
export type Selection = vscode.Selection;
export type Uri = vscode.Uri;
export type MarkedString = vscode.MarkedString;
export type Hover = vscode.Hover;
export type CodeAction = vscode.CodeAction;
export type CodeActionKind = vscode.CodeActionKind;
export type CodeActionProvider = vscode.CodeActionProvider;
export type CodeActionContext = vscode.CodeActionContext;
export type Command = vscode.Command;
export type TextEditorDecorationType = vscode.TextEditorDecorationType;
export type DecorationOptions = vscode.DecorationOptions;
export type ThemeColor = vscode.ThemeColor;
export type ThemableDecorationInstanceRenderOptions = vscode.ThemableDecorationInstanceRenderOptions;
export type CodeActionProviderMetadata = vscode.CodeActionProviderMetadata;
export enum Language {
  TypeScript,
  JavaScript,
  HTML,
  PJSON,
}
export type OssRange = {
  start: {
    line: number;
    column: number;
  };
  end: {
    line: number;
    column: number;
  };
};
export type ImportedModule = {
  fileName: string;
  name: string;
  line: number | null;
  loc: OssRange | null;
  string: string;
  version?: string;
};
export type LineDecorations = DecorationOptions[];
