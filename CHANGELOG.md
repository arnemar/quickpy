# Change Log

All notable changes to the "QuickPy" extension will be documented in this file.

This project adheres to [Keep a Changelog](http://keepachangelog.com/).

## [2.0.0] - 2025-08-25

### Added
- **Cell-Based Execution**: Support for executing code in cells separated by `# %%`, similar to Jupyter notebooks.
- **Interactive Input**: Added support for scripts that require user input via the `input()` function.
- **Full Output Display**: The extension now displays the complete output from the script, not just the last line.
- **Improved Error Reporting**: Error messages are now more detailed, showing the full traceback.

### Changed
- The execution engine was refactored to use `child_process.spawn` instead of `child_process.exec` to allow for interactive input.

### Fixed
- Corrected a bug in the test suite that caused intermittent failures.

---

## [1.1.0] - 2025-08-24

### Added
- Command `quickpy.toggleLiveExecution` to enable or disable live execution on the fly.
- A status bar item (`QuickPy: On/Off`) to show the current state and allow toggling by clicking.
- Integration with the official Microsoft Python extension (`ms-python.python`) to reliably find the selected Python interpreter.

### Changed
- **Breaking change**: The extension now requires the `ms-python.python` extension to be installed.
- Refactored the entire codebase from a single file into a class-based structure (`LiveExecutionProvider`) for better maintainability and to prevent state conflicts between different editors.
- The live execution logic is now managed per-editor instead of globally.

### Fixed
- The Python interpreter path is now discovered reliably, fixing issues with `conda`, `pyenv`, and custom-named virtual environments.
- Resources (event listeners, decorations) are now properly disposed of when an editor is closed.

---

## [1.0.0] 2024-11-23
### Added
- Live Python code execution that evaluates up to the current line in a file.
- Automatic debounce delay configuration for live execution (default: 300ms).
- Inline output display for Python code execution, including:
  - `outputColor` to customize inline output text color (default: grey).
  - `errorColor` to customize error highlight text color (default: red).
- Smart detection for code lines to evaluate, excluding constructs like `def`, `for`, `while`, etc.
- Inline error highlighting and concise error messages displayed after execution errors.
- Automatic detection and usage of `.venv/bin/python` if present in the project directory.
- Fallback to default Python interpreter if a virtual environment is unavailable.
- Temporary file-based execution for error handling and cleanup.
- Comprehensive error display, including:
  - Inline error annotations for the relevant lines.
  - Full error details in a popup for context.
- Persistent decorations for output and error lines.

### Changed
- Enhanced error handling to provide concise inline error messages and popup notifications.
- Output now includes the last line of results or `<No Output>` for empty results.

### Fixed
- Resolved issues with non-existent virtual environments causing execution failures.
- Ensured cleanup of temporary files after each execution.

---
