import * as vscode from 'vscode';
import { MarkdownString } from './types';

export function getMarkdownString(value?: string, supportThemeIcons?: boolean): MarkdownString {
  return new vscode.MarkdownString(value, supportThemeIcons);
}
