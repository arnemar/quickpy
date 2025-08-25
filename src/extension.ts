import { spawn } from 'child_process';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';

const writeFilePromise = promisify(fs.writeFile);
const unlinkPromise = promisify(fs.unlink);

// --- Types for Python Extension API ---
interface PythonExecutionDetails {
    execCommand: string[] | undefined;
}

interface PythonExtensionApi {
    ready: Promise<void>;
    settings: {
        getExecutionDetails(resource?: vscode.Uri): PythonExecutionDetails;
    };
}

// --- Main Controller ---

let isActive = true;
let statusBarItem: vscode.StatusBarItem;
const providers = new Map<vscode.TextEditor, LiveExecutionProvider>();

export async function activate(context: vscode.ExtensionContext) {
    const pythonExtension = vscode.extensions.getExtension<PythonExtensionApi>('ms-python.python');
    if (!pythonExtension) {
        vscode.window.showErrorMessage('The Python extension (ms-python.python) is required for QuickPy to work. Please install it.');
        return;
    }

    await pythonExtension.activate();
    await pythonExtension.exports.ready;

    // --- Status Bar ---
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'quickpy.toggleLiveExecution';
    context.subscriptions.push(statusBarItem);
    updateStatusBar();
    statusBarItem.show();

    // --- Commands ---
    const toggleCommand = vscode.commands.registerCommand('quickpy.toggleLiveExecution', () => {
        isActive = !isActive;
        updateStatusBar();
        if (!isActive) {
            providers.forEach(provider => provider.dispose());
            providers.clear();
        } else {
            if (vscode.window.activeTextEditor) {
                updateProvider(vscode.window.activeTextEditor, pythonExtension.exports);
            }
        }
    });
    context.subscriptions.push(toggleCommand);

    // --- Event Listeners for Editor Lifecycle ---
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor && isActive) {
                updateProvider(editor, pythonExtension.exports);
            }
        }),
        vscode.workspace.onDidCloseTextDocument(doc => {
            for (const [editor, provider] of providers.entries()) {
                if (editor.document === doc) {
                    provider.dispose();
                    providers.delete(editor);
                    break;
                }
            }
        })
    );

    // --- Initial Setup ---
    if (vscode.window.activeTextEditor && isActive) {
        updateProvider(vscode.window.activeTextEditor, pythonExtension.exports);
    }
}

function updateProvider(editor: vscode.TextEditor, pythonApi: PythonExtensionApi) {
    if (editor.document.languageId !== 'python') {
        return;
    }
    if (!providers.has(editor)) {
        const provider = new LiveExecutionProvider(editor, pythonApi);
        providers.set(editor, provider);
    }
}

function updateStatusBar() {
    statusBarItem.text = `QuickPy: ${isActive ? 'On' : 'Off'}`;
    statusBarItem.tooltip = 'Click to toggle live Python execution';
}

// --- Live Execution Logic per Editor ---

export class LiveExecutionProvider {
    private editor: vscode.TextEditor;
    private pythonPath: string;
    private timeout: NodeJS.Timeout | undefined;
    private outputDecorationType: vscode.TextEditorDecorationType;
    private errorDecorationType: vscode.TextEditorDecorationType;
    private disposables: vscode.Disposable[] = [];
    private pythonProcess: import('child_process').ChildProcess | undefined;

    constructor(editor: vscode.TextEditor, pythonApi: PythonExtensionApi) {
        this.editor = editor;
        const execDetails = pythonApi.settings.getExecutionDetails(editor.document.uri);
        this.pythonPath = execDetails?.execCommand?.[0] || 'python3';

        // Initialize decoration types with colors from settings
        const outputColor = vscode.workspace.getConfiguration('pythonLiveExecution').get<string>('outputColor') || 'grey';
        const errorColor = vscode.workspace.getConfiguration('pythonLiveExecution').get<string>('errorColor') || 'red';

        this.outputDecorationType = vscode.window.createTextEditorDecorationType({});
        this.errorDecorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: errorColor,
        });

        // Add event listeners
        this.disposables.push(
            vscode.workspace.onDidChangeTextDocument(this.onTextChange.bind(this)),
            vscode.window.onDidChangeTextEditorSelection(this.onSelectionChange.bind(this))
        );
    }

    private onTextChange(event: vscode.TextDocumentChangeEvent) {
        if (event.document === this.editor.document) {
            this.scheduleExecution();
        }
    }

    private onSelectionChange(event: vscode.TextEditorSelectionChangeEvent) {
        if (event.textEditor === this.editor) {
            this.scheduleExecution();
        }
    }

    private scheduleExecution() {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        if (this.pythonProcess) {
            this.pythonProcess.kill();
            this.pythonProcess = undefined;
        }
        const debounceDelay = vscode.workspace.getConfiguration('pythonLiveExecution').get<number>('debounceDelay') || 300;
        this.timeout = setTimeout(() => this.execute(), debounceDelay);
    }

    private async execute() {
        this.clearDecorations();
        const currentLine = this.editor.selection.active.line;
        const code = this.editor.document.getText();
        const lines = code.split('\n');
        
        const cellRanges = this.findCellRanges(lines);
        const currentCellRange = cellRanges.find(range => currentLine >= range.start && currentLine <= range.end);

        let codeToExecute: string;
        let executionLine: number;

        if (currentCellRange) {
            codeToExecute = lines.slice(currentCellRange.start, currentCellRange.end + 1).join('\n');
            executionLine = currentCellRange.end;
        } else {
            codeToExecute = lines.slice(0, currentLine + 1).join('\n');
            executionLine = currentLine;
        }

        if (!codeToExecute.trim()) {
            return;
        }

        const tempFilePath = path.join(os.tmpdir(), `quickpy_${Date.now()}.py`);

        try {
            await writeFilePromise(tempFilePath, codeToExecute, { encoding: 'utf-8' });
            
            this.pythonProcess = spawn(this.pythonPath, [tempFilePath]);
            let stdout = '';
            let stderr = '';

            this.pythonProcess.stdout?.on('data', (data) => {
                stdout += data.toString();
                // A simple way to detect input prompts
                if (data.toString().includes('input')) {
                    vscode.window.showInputBox({ prompt: 'Enter input for python script' }).then(input => {
                        this.pythonProcess?.stdin?.write(input + '\n');
                    });
                }
            });

            this.pythonProcess.stderr?.on('data', (data) => {
                stderr += data.toString();
            });

            this.pythonProcess.on('close', (code) => {
                if (stderr) {
                    this.handleError(stderr, executionLine);
                } else if (stdout) {
                    this.handleOutput(stdout, executionLine);
                }
                unlinkPromise(tempFilePath).catch(() => {}); // Clean up temp file
                this.pythonProcess = undefined;
            });

        } catch (error: any) {
            this.handleError(error.stderr || error.message, executionLine);
            this.pythonProcess = undefined;
        }
    }

    private findCellRanges(lines: string[]): { start: number, end: number }[] {
        const cellRanges: { start: number, end: number }[] = [];
        let currentCellStart = 0;

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim() === '# %%') {
                if (i > currentCellStart) {
                    cellRanges.push({ start: currentCellStart, end: i - 1 });
                }
                currentCellStart = i + 1;
            }
        }

        if (currentCellStart < lines.length) {
            cellRanges.push({ start: currentCellStart, end: lines.length - 1 });
        }

        return cellRanges;
    }

    private handleError(stderr: string, line: number) {
        const errorLines = stderr.trim().split('\n');
        const errorMessage = errorLines.join(' | ');
        const match = stderr.match(/File ".*?", line (\d+)/);
        const errorLineNumber = match ? parseInt(match[1], 10) - 1 : line;

        // Highlight the line where the error occurred
        const range = new vscode.Range(errorLineNumber, 0, errorLineNumber, this.editor.document.lineAt(errorLineNumber).text.length);
        this.editor.setDecorations(this.errorDecorationType, [{ range }]);

        // Display the concise error message
        this.displayInlineMessage(`# Error: ${errorMessage}`, errorLineNumber, 'red');
    }

    private handleOutput(stdout: string, line: number) {
        const outputLines = stdout.trim().split('\n');
        if (outputLines.length > 0 && outputLines[0] !== '') {
            const output = outputLines.join(' | ');
            this.displayInlineMessage(`# ${output}`, line, 'grey');
        }
    }

    private displayInlineMessage(text: string, line: number, color: string) {
        const decoration: vscode.DecorationOptions = {
            range: new vscode.Range(line, 1024, line, 1024), // Place at the end of the line
            renderOptions: {
                after: {
                    contentText: text,
                    color: color,
                    margin: '0 0 0 1em'
                },
            },
        };
        this.editor.setDecorations(this.outputDecorationType, [decoration]);
    }

    private clearDecorations() {
        this.editor.setDecorations(this.outputDecorationType, []);
        this.editor.setDecorations(this.errorDecorationType, []);
    }

    public dispose() {
        this.clearDecorations();
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        if (this.pythonProcess) {
            this.pythonProcess.kill();
            this.pythonProcess = undefined;
        }
        this.disposables.forEach(d => d.dispose());
    }
}



export function deactivate() {
    providers.forEach(provider => provider.dispose());
    providers.clear();
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}