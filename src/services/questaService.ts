import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { spawn } from 'node:child_process';
import { ProcessResult, ProjectPaths, QuestaConfig } from '../types';

export interface TranscriptSink { info(message: string): void; write(text: string): void; }

export type Runner = (executable: string, args: string[], cwd: string, output: TranscriptSink, hideWindow?: boolean) => Promise<ProcessResult>;

export const spawnProcess: Runner = (executable, args, cwd, output, hideWindow = true) => new Promise((resolve, reject) => {
  output.info(`$ ${executable} ${args.map(arg => JSON.stringify(arg)).join(' ')}`);
  // windowsHide sets an inherited SW_HIDE show-state on Windows; Tk-based GUI apps like vsim's
  // GUI honor that for their main window, so it must stay visible for GUI simulations.
  const child = spawn(executable, args, { cwd, shell: false, windowsHide: hideWindow });
  child.stdout.on('data', data => output.write(data.toString()));
  child.stderr.on('data', data => output.write(data.toString()));
  child.once('error', reject);
  child.once('close', (code, signal) => resolve({ code: code ?? 1, signal }));
});

async function executableExists(candidate: string): Promise<boolean> {
  if (!candidate) { return false; }
  if (!path.isAbsolute(candidate) && !candidate.includes(path.sep) && !candidate.includes('/')) {
    const extensions = process.platform === 'win32'
      ? (path.extname(candidate) ? [''] : (process.env.PATHEXT ?? '.COM;.EXE;.BAT;.CMD').split(';'))
      : [''];
    for (const directory of (process.env.PATH ?? '').split(path.delimiter)) {
      for (const extension of extensions) {
        try { await fs.access(path.join(directory, `${candidate}${extension}`)); return true; } catch { /* keep searching */ }
      }
    }
    return false;
  }
  try { await fs.access(candidate); return true; } catch { return false; }
}

function siblingExecutable(vsim: string, name: string): string {
  if (!vsim || (!path.isAbsolute(vsim) && !vsim.includes(path.sep))) { return process.platform === 'win32' ? `${name}.exe` : name; }
  return path.join(path.dirname(vsim), process.platform === 'win32' ? `${name}.exe` : name);
}

export class QuestaService {
  constructor(private readonly output: TranscriptSink, private readonly runner: Runner = spawnProcess) {}

  async resolveExecutables(config: QuestaConfig): Promise<{ vsim: string; vlog: string; vlib: string; vmap: string }> {
    const defaultVsim = process.platform === 'win32' ? 'vsim.exe' : 'vsim';
    const vsim = config.vsimPath || defaultVsim;
    if (!(await executableExists(vsim))) { throw new Error('QuestaSim executable was not found. Configure questa.vsimPath in VS Code settings.'); }
    const vlog = config.vlogPath || siblingExecutable(vsim, 'vlog');
    if (!(await executableExists(vlog))) { throw new Error('Questa vlog executable was not found. Configure questa.vlogPath in VS Code settings.'); }
    const vlib = siblingExecutable(vsim, 'vlib');
    const vmap = siblingExecutable(vsim, 'vmap');
    if (!(await executableExists(vlib)) || !(await executableExists(vmap))) {
      throw new Error('QuestaSim support executables (vlib or vmap) were not found next to vsim. Check questa.vsimPath.');
    }
    return { vsim, vlog, vlib, vmap };
  }

  async compile(paths: ProjectPaths, config: QuestaConfig): Promise<void> {
    const tools = await this.resolveExecutables(config);
    await fs.mkdir(paths.simulationDirectory, { recursive: true });
    const work = path.join(paths.simulationDirectory, 'work');
    this.output.info('Starting compilation...');
    this.output.info(`Source list: ${paths.sourceList}`);
    try { await fs.access(work); }
    catch {
      const vlib = await this.runner(tools.vlib, [work], paths.workspace, this.output);
      if (vlib.code !== 0) { throw new Error('Compilation failed. See the QuestaSim transcript for details.'); }
    }
    const vmap = await this.runner(tools.vmap, ['work', work], paths.workspace, this.output);
    if (vmap.code !== 0) { throw new Error('Compilation failed. See the QuestaSim transcript for details.'); }
    const includeArgs = config.includeDirectories.map(dir => `+incdir+${path.isAbsolute(dir) ? dir : path.resolve(paths.workspace, dir)}`);
    const macroArgs = config.macroDefinitions.filter(Boolean).map(macro => `+define+${macro}`);
    const vlog = await this.runner(tools.vlog, ['-work', 'work', '-sv', ...includeArgs, ...macroArgs, ...config.additionalVlogArguments, '-f', paths.sourceList], paths.workspace, this.output);
    if (vlog.code !== 0) { throw new Error('Compilation failed. See the QuestaSim transcript for details.'); }
    this.output.info('Compilation finished successfully.');
  }

  async run(paths: ProjectPaths, config: QuestaConfig, runDo: string, applyAdditionalArguments = false, cwd = paths.simulationDirectory): Promise<void> {
    const { vsim } = await this.resolveExecutables(config);
    const args = applyAdditionalArguments ? [...config.additionalVsimArguments] : [];
    if (config.simulationMode === 'console') { args.push('-c'); }
    args.push('-do', `do {${runDo.replace(/\\/g, '/').replace(/[{}]/g, '\\$&')}}`);
    this.output.info(`Starting ${config.simulationMode} simulation...`);
    const result = await this.runner(vsim, args, cwd, this.output, config.simulationMode !== 'gui');
    if (result.code !== 0) { throw new Error('Simulation failed. See the QuestaSim transcript for details.'); }
    this.output.info('Simulation finished.');
  }
}
