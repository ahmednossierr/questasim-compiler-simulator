# QuestaSim Compiler & Simulator

Run Verilog and SystemVerilog projects with **QuestaSim** or **ModelSim** directly from VS Code. Generate a source list, compile your design, run a testbench, and read the complete simulator transcript without switching to an external terminal.

## 🎥 Video Tutorial

See QuestaSim Compiler & Simulator in action and learn how to run Verilog/SystemVerilog simulations directly from VS Code.

<p align="center">
  <img src="https://raw.githubusercontent.com/ahmednossierr/questasim-compiler-simulator/main/media/demo-v0.1.6.gif" alt="QuestaSim Compiler & Simulator Tutorial" width="850">
</p>

## What you need

Before using this extension, make sure that:

- QuestaSim or ModelSim is installed on your computer.
- You have opened your HDL project folder in VS Code.
- Your project contains Verilog/SystemVerilog files (`.v`, `.sv`, `.vh`, or `.svh`).
- You know the name of the simulation **testbench** top module, such as `alu_tb` or `up_down_counter_tb`.

> Select the testbench as the top module in the normal workflow. The testbench instantiates and drives your RTL design, then checks the result. Select an RTL module only when you intentionally want to simulate it by itself.

## First-time setup

### 1. Install the extension

Install **QuestaSim Compiler & Simulator** from the VS Code Marketplace, then reload VS Code if it asks you to.

### 2. Open your Verilog project

Use **File → Open Folder...** and open the folder containing your RTL and testbench files.

For example:

```text
counter-project/
├── rtl/
│   └── up_down_counter.v
└── tb/
    └── up_down_counter_tb.v
```

### 3. Choose the testbench top module

Open the Command Palette and run **Questa: Select Top Module**.

You can select a testbench file or type its module name manually. For the example above, enter:

```text
up_down_counter_tb
```

The extension saves this as the workspace setting `questa.topModule`.

## Run your first simulation

Follow these steps in order:

1. Run **Questa: Generate Source List**.
   - Creates `sources.f` in the project root.
   - Finds HDL source files automatically.

2. Run **Questa: Generate run.do**.
   - Creates `sim/run.do` by default.
   - Creates the simulation directory when it does not exist.

3. Run **Questa: Compile**.
   - Refreshes `sources.f`.
   - Creates or maps the Questa `work` library in `sim/`.
   - Runs `vlog` and shows the complete output in VS Code.

4. Run **Questa: Run Simulation**.
   - Runs your configured testbench.
   - In console mode, runs `vsim -c` and exits after the testbench finishes.

5. Open the transcript if it is not already visible.
   - Run **Questa: Show Transcript**, or select **QuestaSim** in **View → Output**.

The expected generated files look like this:

```text
counter-project/
├── rtl/
├── tb/
├── sources.f
└── sim/
    ├── run.do
    └── work/
```

## Everyday workflow

After setup, the usual loop is simple:

```text
Edit RTL or testbench
        ↓
Questa: Compile
        ↓
Questa: Run Simulation
        ↓
Read results in the QuestaSim Output channel
```

With `questa.autoGenerateSourceList` enabled (the default), `sources.f` is refreshed automatically when HDL files are added, edited, renamed, or removed.

Click `$(play) Questa` in the VS Code status bar to open quick access to Compile, Run Simulation, source generation, the transcript, and settings.

## Simulation modes

The default is console simulation:

```json
{
  "questa.simulationMode": "console"
}
```

Use GUI mode to open the QuestaSim graphical window:

```json
{
  "questa.simulationMode": "gui"
}
```

You can also run **Questa: Open Waveform**, which launches the generated script in GUI mode. Waveforms are displayed by QuestaSim itself.

## Configuration reference

Add these settings to your workspace when needed:

```json
{
  "questa.vsimPath": "C:/questasim/bin/vsim.exe",
  "questa.vlogPath": "",
  "questa.topModule": "alu_tb",
  "questa.simulationDirectory": "sim",
  "questa.sourceListFile": "sources.f",
  "questa.runDoFile": "run.do",
  "questa.simulationMode": "console",
  "questa.autoGenerateSourceList": true,
  "questa.includeDirectories": ["rtl/include"],
  "questa.macroDefinitions": ["SIMULATION", "WIDTH=8"],
  "questa.additionalVlogArguments": [],
  "questa.additionalVsimArguments": []
}
```

`simulationDirectory` is relative to your workspace by default. It keeps generated scripts and Questa work libraries separate from your RTL source tree.

### Source-file order

The extension uses this sensible default order:

1. Header and include files (`.vh`, `.svh`)
2. Package files (for example, `*_pkg.sv`)
3. RTL source files
4. Testbench files (for example, files in `tb/` or ending with `_tb.sv`)

For projects that require a strict custom order, set `questa.sourceOrder` with ordered glob patterns:

```json
{
  "questa.sourceOrder": [
    "rtl/packages/**/*.sv",
    "rtl/**/*.sv",
    "rtl/**/*.v",
    "tb/**/*.sv"
  ]
}
```

The scanner excludes generated and dependency folders such as `.git`, `node_modules`, `.vscode`, `work`, `build`, and `sim`. Add or change excluded folder names with `questa.excludedDirectories`.

## Existing `run.do` scripts

Many projects already have a hand-written simulation script. Use **Questa: Run Existing run.do** to find and run one without changing it.

When you use **Questa: Generate run.do**, the extension never silently overwrites an existing user-created `run.do`. It offers to create `run_generated.do`, overwrite only after confirmation, or cancel.

## Commands

| Command | What it does |
| --- | --- |
| **Questa: Generate Source List** | Finds HDL files and writes `sources.f`. |
| **Questa: Generate run.do** | Safely creates or updates the managed script. |
| **Questa: Select Top Module** | Chooses or enters the testbench top module. |
| **Questa: Compile** | Compiles HDL files into the `work` library. |
| **Questa: Run Simulation** | Runs the generated script in console or GUI mode. |
| **Questa: Run Existing run.do** | Runs a selected existing script without overwriting it. |
| **Questa: Open Waveform** | Launches the generated script in GUI mode. |
| **Questa: Refresh Sources** | Rescans the workspace and regenerates `sources.f`. |
| **Questa: Show Transcript** | Opens the **QuestaSim** Output channel. |
| **Questa: Clear Transcript** | Clears the Output-channel transcript. |

## Troubleshooting

### “QuestaSim executable was not found”

Set `questa.vsimPath` to the full path of `vsim.exe` on Windows, or `vsim` on Linux. Confirm the path points to the QuestaSim installation, not a shortcut.

### “No top module configured”

Run **Questa: Select Top Module** and choose or enter the testbench module name.

### Compilation errors or simulation failures

Run **Questa: Show Transcript**. The Output channel contains the complete `vlib`, `vmap`, `vlog`, and `vsim` messages, including the original file and line reported by QuestaSim.

### My files compile in the wrong order

Configure `questa.sourceOrder` as shown above. This is common when packages, interfaces, or generated source files have dependencies that cannot be inferred from filenames.

### Optional: Configure the QuestaSim installation path

You normally do **not** need this step. If **Questa: Compile** already works, VS Code has found QuestaSim through your system `PATH`.

Only configure these paths if the extension reports that `vsim`, `vlog`, `vlib`, or `vmap` cannot be found, or if you want this workspace to use a specific QuestaSim installation.

Open the Command Palette (`Ctrl+Shift+P`), run **Preferences: Open Workspace Settings (JSON)**, and add:

```json
{
  "questa.vsimPath": "C:/questasim/bin/vsim.exe",
  "questa.vlogPath": "C:/questasim/bin/vlog.exe"
}
```

If `vlog.exe` is in the same folder as `vsim.exe`, `questa.vlogPath` is optional; the extension derives it automatically.

Linux example:

```json
{
  "questa.vsimPath": "/opt/questasim/bin/vsim",
  "questa.vlogPath": "/opt/questasim/bin/vlog"
}
```

## 👨‍💻 Developer

Created by **Ahmed Nossier**

[Connect with me on LinkedIn](https://www.linkedin.com/in/ahmednossier1)

## Author & links

- [LinkedIn — Ahmed Nossier](https://www.linkedin.com/in/ahmednossier1)
- [YouTube — Nossier1](https://www.youtube.com/@Nossier1)
