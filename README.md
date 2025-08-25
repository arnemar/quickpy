# QuickPy

[![Build Status](https://img.shields.io/github/workflow/status/arnemar/quickpy/CI)](https://github.com/arnemar/quickpy/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**QuickPy** is a Visual Studio Code extension that provides **live feedback** on Python code execution. This is a modification of the original project by [Kalle Hallden](https://github.com/kallehallden).

---

## Table of Contents
- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)
- [Contact](#contact)

---

## Features

- **Live Python Execution**: See your code in action instantly as you write.
- **Cell-Based Execution**: Structure your code with `# %%` separators and run cells individually, just like in a Jupyter Notebook.
- **Interactive Input**: Scripts that require user input via the `input()` function are now supported.
- **Reliable Interpreter Detection**: Automatically uses the interpreter selected in the official Python extension, ensuring it works seamlessly with virtual environments, `conda`, `pyenv`, etc.
- **Toggle Live Execution**: Easily enable or disable live execution on the fly with a command.
- **Status Bar Indicator**: See the current status (`QuickPy: On` or `QuickPy: Off`) in the status bar and click to toggle.
- **Error Feedback**: Get quick visual indications of errors in your code.
- **Full Output Display**: See the complete output from your script, not just the last line.

---

## Requirements

- [Visual Studio Code](https://code.visualstudio.com/)
- [Python Extension (ms-python.python)](https://marketplace.visualstudio.com/items?itemName=ms-python.python): This extension is now required for QuickPy to find your Python interpreter reliably.

---

## Installation

1.  **Install the required Python Extension** from the VS Code Marketplace.
2.  Clone the repository:
    ```bash
    git clone https://github.com/arnemar/quickpy.git
    ```
3.  Build the `.vsix` file:
    ```bash
    npm install
    npm run package
    ```
4.  Install the extension manually in Visual Studio Code:
    - Open VS Code and navigate to the Extensions sidebar (`Ctrl+Shift+X` or `Cmd+Shift+X`).
    - Click on the three dots (...) in the top right corner and select **Install from VSIX...**.
    - Select the generated `.vsix` file from your project directory.

---

## Usage

1.  Open a Python file in VS Code.
2.  Ensure QuickPy is enabled. You can see the status in the bottom-right corner (`QuickPy: On`).
3.  Start editing your code and see the results appear inline instantly!

### Cell-Based Execution

You can structure your code into cells using a `# %%` separator. When your cursor is within a cell, QuickPy will only execute the code in that cell. This allows for a more organized and interactive workflow.

Example:
```python
# %%
a = 10
print(a)

# %%
b = 20
print(b)
```

### Interactive Input

If your script requires user input (e.g., using the `input()` function), QuickPy will open an input box in VS Code to prompt you for the necessary information.

To toggle live execution, you can either:
- Click the **`QuickPy: On/Off`** text in the status bar.
- Run the **`QuickPy: Toggle Live Execution`** command from the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).

---

## Contributing

We welcome contributions to improve QuickPy! Here’s how you can get started:

1.  Fork the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Open the project in Visual Studio Code and start developing.
4.  Submit a pull request with your changes.

---

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

---

## Acknowledgements

- This project is inspired by [Lowpy](https://github.com/kallehallden/lowpy) by [Kalle Hallden](https://github.com/kallehallden).
- [Quokka.js](https://quokkajs.com/) for JavaScript inspiration.
- Built using the [VS Code API](https://code.visualstudio.com/api) and [Python](https://www.python.org/).

---

## Contact

For any questions, issues, or suggestions:

Open an issue on [Github](https://github.com/arnemar/quickpy/issues).

---

## 🚀 Try QuickPy today and make Python development faster and more fun!


