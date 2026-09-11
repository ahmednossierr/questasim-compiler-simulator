import * as vscode from 'vscode';

export class Transcript {
  readonly channel = vscode.window.createOutputChannel('QuestaSim', { log: true });
  show(): void { this.channel.show(true); }
  clear(): void { this.channel.clear(); }
  info(message: string): void { this.channel.appendLine(`[Questa] ${message}`); }
  write(text: string): void { this.channel.append(text); }
  dispose(): void { this.channel.dispose(); }
}
