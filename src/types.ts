export type SimulationMode = 'console' | 'gui';

export interface QuestaConfig {
  vsimPath: string;
  vlogPath: string;
  topModule: string;
  simulationDirectory: string;
  sourceListFile: string;
  runDoFile: string;
  simulationMode: SimulationMode;
  autoGenerateSourceList: boolean;
  excludedDirectories: string[];
  sourceOrder: string[];
  includeDirectories: string[];
  macroDefinitions: string[];
  additionalVlogArguments: string[];
  additionalVsimArguments: string[];
  useIntegratedTerminal: boolean;
}

export interface ProjectPaths {
  workspace: string;
  simulationDirectory: string;
  sourceList: string;
  runDo: string;
}

export interface ProcessResult { code: number; signal: NodeJS.Signals | null; }
