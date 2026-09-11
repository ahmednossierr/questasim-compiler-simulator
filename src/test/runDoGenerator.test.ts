import assert from 'node:assert/strict';
import * as path from 'node:path';
import test from 'node:test';
import { generateRunDo } from '../services/runDoGenerator';
import { ProjectPaths, QuestaConfig } from '../types';

const config: QuestaConfig = {
  vsimPath: '', vlogPath: '', topModule: 'alu_tb', simulationDirectory: 'sim', sourceListFile: 'sources.f', runDoFile: 'run.do', simulationMode: 'console', autoGenerateSourceList: true,
  excludedDirectories: [], sourceOrder: [], includeDirectories: ['rtl/include'], macroDefinitions: ['WIDTH=8'], additionalVlogArguments: ['+lint=all'], additionalVsimArguments: ['-t', '1ns'], useIntegratedTerminal: false
};

test('generates a portable run.do with SystemVerilog, include, macro, and top settings', () => {
  const paths: ProjectPaths = { workspace: path.resolve('/project'), simulationDirectory: path.resolve('/project/sim'), sourceList: path.resolve('/project/sources.f'), runDo: path.resolve('/project/sim/run.do') };
  const script = generateRunDo(paths, config);
  const sourceList = paths.sourceList.replace(/\\/g, '/');
  const includeDirectory = path.resolve(paths.workspace, 'rtl/include').replace(/\\/g, '/');
  assert.match(script, /vlib work/);
  assert.equal(script.includes(`set questa_workspace {${paths.workspace.replace(/\\/g, '/')}}`), true);
  assert.match(script, /cd \$questa_workspace/);
  assert.match(script, /cd \$questa_simulation_directory/);
  assert.match(script, /vlog -work work -sv/);
  assert.equal(script.includes(`{+incdir+${includeDirectory}}`), true);
  assert.match(script, /\+define\+WIDTH=8/);
  assert.match(script, /vsim \{-t\} \{1ns\} work\.alu_tb/);
  assert.equal(script.includes(`-f {${sourceList}}`), true);
});

test('rejects a generated run.do without a top module', () => {
  const paths: ProjectPaths = { workspace: '/project', simulationDirectory: '/project/sim', sourceList: '/project/sources.f', runDo: '/project/sim/run.do' };
  assert.throws(() => generateRunDo(paths, { ...config, topModule: '' }), /No top module configured/);
});

test('console mode quits after running so batch simulations exit cleanly', () => {
  const paths: ProjectPaths = { workspace: '/project', simulationDirectory: '/project/sim', sourceList: '/project/sources.f', runDo: '/project/sim/run.do' };
  const script = generateRunDo(paths, config);
  assert.match(script, /run -all\nquit -f/);
  assert.equal(script.includes('add wave'), false);
});

test('gui mode adds waves and stays open instead of quitting so the waveform is visible', () => {
  const paths: ProjectPaths = { workspace: '/project', simulationDirectory: '/project/sim', sourceList: '/project/sources.f', runDo: '/project/sim/run.do' };
  const script = generateRunDo(paths, { ...config, simulationMode: 'gui' });
  assert.match(script, /add wave -r \/\*\nrun -all/);
  assert.equal(script.includes('quit -f'), false);
  assert.match(script, /vsim -voptargs=\+acc \{-t\} \{1ns\} work\.alu_tb/);
});
