import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import test from 'node:test';
import { QuestaService, Runner, TranscriptSink } from '../services/questaService';
import { QuestaConfig } from '../types';

const config: QuestaConfig = {
  vsimPath: '', vlogPath: '', topModule: 'tb', simulationDirectory: 'sim', sourceListFile: 'sources.f', runDoFile: 'run.do', simulationMode: 'console', autoGenerateSourceList: false,
  excludedDirectories: [], sourceOrder: [], includeDirectories: [], macroDefinitions: [], additionalVlogArguments: [], additionalVsimArguments: [], useIntegratedTerminal: false
};
const output: TranscriptSink = { info: () => undefined, write: () => undefined };

test('reports a useful error for a missing configured Questa executable', async () => {
  const service = new QuestaService(output);
  await assert.rejects(service.resolveExecutables({ ...config, vsimPath: '/definitely/not/a/questasim/vsim' }), /QuestaSim executable was not found/);
});

test('compile invokes vlib, vmap, and vlog as separate argument-safe processes', async () => {
  const calls: Array<{ executable: string; args: string[] }> = [];
  const runner: Runner = async (executable, args) => { calls.push({ executable, args }); return { code: 0, signal: null }; };
  const service = new QuestaService(output, runner);
  const root = await mkdtemp(path.join(tmpdir(), 'questa-service-'));
  try {
    const bin = path.join(root, 'bin');
    await writeFile(path.join(root, 'sources.f'), '');
    await mkdir(bin);
    const extension = process.platform === 'win32' ? '.exe' : '';
    await Promise.all(['vsim', 'vlog', 'vlib', 'vmap'].map(name => writeFile(path.join(bin, `${name}${extension}`), '')));
    await service.compile({ workspace: root, simulationDirectory: path.join(root, 'sim'), sourceList: path.join(root, 'sources.f'), runDo: path.join(root, 'sim', 'run.do') }, { ...config, vsimPath: path.join(bin, `vsim${extension}`) });
    assert.equal(calls.length, 3);
    assert.equal(calls[2].args.includes('-f'), true);
    assert.equal(calls[2].args.includes('-sv'), true);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('gui simulations keep the vsim window visible on Windows instead of hiding it', async () => {
  const hideWindowCalls: Array<boolean | undefined> = [];
  const runner: Runner = async (executable, args, cwd, output, hideWindow) => { hideWindowCalls.push(hideWindow); return { code: 0, signal: null }; };
  const service = new QuestaService(output, runner);
  const root = await mkdtemp(path.join(tmpdir(), 'questa-service-'));
  try {
    const bin = path.join(root, 'bin');
    await mkdir(bin);
    const extension = process.platform === 'win32' ? '.exe' : '';
    await Promise.all(['vsim', 'vlog', 'vlib', 'vmap'].map(name => writeFile(path.join(bin, `${name}${extension}`), '')));
    const vsimPath = path.join(bin, `vsim${extension}`);
    await service.run({ workspace: root, simulationDirectory: root, sourceList: path.join(root, 'sources.f'), runDo: path.join(root, 'run.do') }, { ...config, vsimPath, simulationMode: 'gui' }, path.join(root, 'run.do'));
    await service.run({ workspace: root, simulationDirectory: root, sourceList: path.join(root, 'sources.f'), runDo: path.join(root, 'run.do') }, { ...config, vsimPath, simulationMode: 'console' }, path.join(root, 'run.do'));
    assert.deepEqual(hideWindowCalls, [false, true]);
  } finally { await rm(root, { recursive: true, force: true }); }
});
