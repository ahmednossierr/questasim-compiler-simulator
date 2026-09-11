# Changelog

## 0.1.5

- Fixed the tutorial GIF showing as a broken image on the Marketplace page and in the VS Code Extension Details page. Neither renderer resolves relative image paths, even when the file ships inside the extension, so the README now references the GIF by absolute URL. Added a `repository` field so `vsce` can rewrite any future relative links automatically.

## 0.1.4

- Documentation only: added a "🎥 Video Tutorial" section to the README with an embedded, auto-playing animated demo (`media/demo.gif`) shown directly on the Extension Details page, plus a "👨‍💻 Developer" section with a LinkedIn link. No functional changes.

## 0.1.3

- Fixed the actual reason "Questa: Open Waveform" never showed a window: simulations were always spawned with `windowsHide: true`, which sets an inherited hidden show-state on Windows that vsim's Tk-based GUI honors for its main window. GUI simulations now spawn with the window visible; console/batch runs (vlib, vmap, vlog, and console-mode vsim) still spawn hidden as before.

## 0.1.2

- Fixed "Questa: Open Waveform" failing with "No objects found matching '/*'" (vish-4014) and aborting. QuestaSim's default implicit optimization strips signal visibility; the generated run.do now passes `-voptargs=+acc` to vsim in GUI mode so signals stay visible for the Wave window.

## 0.1.1

- Fixed "Questa: Open Waveform" closing the GUI immediately after the run finished. The generated run.do now adds a wave view and stays open in GUI mode instead of force-quitting, so the Wave window is actually visible.

## 0.1.0

- Initial release with source discovery, generated run scripts, compilation, simulation, transcript output, and tests.
