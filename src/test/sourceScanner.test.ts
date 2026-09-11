import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import test from 'node:test';
import { discoverSources, orderSources, sourceListText } from '../services/sourceScanner';

test('discovers HDL files, excludes generated directories, and emits workspace-relative paths', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'questa-scanner-'));
  try {
    await mkdir(path.join(root, 'rtl'), { recursive: true });
    await mkdir(path.join(root, 'node_modules', 'library'), { recursive: true });
    await mkdir(path.join(root, 'sim'), { recursive: true });
    await writeFile(path.join(root, 'rtl', 'alu.sv'), 'module alu; endmodule');
    await writeFile(path.join(root, 'rtl', 'defs.svh'), '`define WIDTH 8');
    await writeFile(path.join(root, 'node_modules', 'library', 'ignored.sv'), 'module ignored; endmodule');
    await writeFile(path.join(root, 'sim', 'generated.v'), 'module generated; endmodule');
    const sources = await discoverSources(root);
    assert.deepEqual(sources.map(file => path.relative(root, file)).sort(), [path.join('rtl', 'alu.sv'), path.join('rtl', 'defs.svh')]);
    assert.equal(sourceListText(root, sources).includes('./rtl/alu.sv'), true);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('orders headers, packages, implementation, and testbenches predictably', () => {
  const root = path.resolve('/project');
  const files = ['tb/alu_tb.sv', 'rtl/alu.sv', 'rtl/core_pkg.sv', 'rtl/defs.svh'].map(file => path.join(root, file));
  assert.deepEqual(orderSources(files, root).map(file => path.relative(root, file).split(path.sep).join('/')), ['rtl/defs.svh', 'rtl/core_pkg.sv', 'rtl/alu.sv', 'tb/alu_tb.sv']);
});

test('honors configured source-order patterns before default ordering', () => {
  const root = path.resolve('/project');
  const files = ['tb/alu_tb.sv', 'rtl/alu.sv', 'rtl/core_pkg.sv'].map(file => path.join(root, file));
  assert.deepEqual(orderSources(files, root, ['rtl/**/*.sv', 'tb/**/*.sv']).map(file => path.relative(root, file).split(path.sep).join('/')), ['rtl/alu.sv', 'rtl/core_pkg.sv', 'tb/alu_tb.sv']);
});
