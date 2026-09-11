import * as path from 'node:path';
import * as vscode from 'vscode';
import { ProjectPaths, QuestaConfig } from '../types';

function arrayValue<T>(value: unknown): T[] {
  return Array.isArray(value) ? value.filter((item): item is T => typeof item === 'string') : [];
}

export function getConfig(): QuestaConfig {
  const config = vscode.workspace.getConfiguration('questa');
  return {
    vsimPath: config.get<string>('vsimPath', '').trim(),
    vlogPath: config.get<string>('vlogPath', '').trim(),
    topModule: config.get<string>('topModule', '').trim(),
    simulationDirectory: config.get<string>('simulationDirectory', 'sim').trim() || 'sim',
    sourceListFile: config.get<string>('sourceListFile', 'sources.f').trim() || 'sources.f',
    runDoFile: config.get<string>('runDoFile', 'run.do').trim() || 'run.do',
    simulationMode: config.get<'console' | 'gui'>('simulationMode', 'console'),
    autoGenerateSourceList: config.get<boolean>('autoGenerateSourceList', true),
    excludedDirectories: arrayValue<string>(config.get('excludedDirectories')),
    sourceOrder: arrayValue<string>(config.get('sourceOrder')),
    includeDirectories: arrayValue<string>(config.get('includeDirectories')),
    macroDefinitions: arrayValue<string>(config.get('macroDefinitions')),
    additionalVlogArguments: arrayValue<string>(config.get('additionalVlogArguments')),
    additionalVsimArguments: arrayValue<string>(config.get('additionalVsimArguments')),
    useIntegratedTerminal: config.get<boolean>('useIntegratedTerminal', false)
  };
}

export function workspaceFolder(): vscode.WorkspaceFolder | undefined {
  return vscode.workspace.workspaceFolders?.[0];
}

export function projectPaths(workspace: string, config: QuestaConfig): ProjectPaths {
  const safeRelative = (file: string, fallback: string) => path.isAbsolute(file) ? file : path.resolve(workspace, file || fallback);
  const simulationDirectory = safeRelative(config.simulationDirectory, 'sim');
  return {
    workspace,
    simulationDirectory,
    sourceList: safeRelative(config.sourceListFile, 'sources.f'),
    runDo: path.isAbsolute(config.runDoFile) ? config.runDoFile : path.resolve(simulationDirectory, config.runDoFile || 'run.do')
  };
}

export async function updateTopModule(value: string): Promise<void> {
  await vscode.workspace.getConfiguration('questa').update('topModule', value, vscode.ConfigurationTarget.Workspace);
}
