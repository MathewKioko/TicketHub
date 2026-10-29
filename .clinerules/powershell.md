Windows PowerShell Terminal Rules

Required shell



This project runs on Windows using Windows PowerShell. The project root is C:\\Users\\ZBOOK\\Documents\\TicketHub.



Command execution rules

Send commands directly to the terminal tool in the exact format required by that tool.

NEVER type a JSON array, such as \["command"], into the terminal.

NEVER wrap a command in an unnecessary powershell -Command invocation when already running PowerShell.

Do not confuse a tool's JSON arguments with the actual shell command.

Do not execute the explanatory text, Markdown fences, or quotation marks surrounding an example command.

Use PowerShell-native syntax by default.

Command equivalents

Search text: Select-String

List files: Get-ChildItem

Read files: Get-Content

Display the first N items: Select-Object -First N

Read file contents safely: Get-Content -Raw

Test file existence: Test-Path

Remove a specific line: use a deliberate file-editing script after inspecting the line and backing up the original.

Use ; for sequential commands when appropriate.

Do not use Bash-only syntax such as sed -i, head, grep, or ls unless explicitly invoking a compatible shell.

Do not use CMD switches such as /b with PowerShell commands.

File editing and safety

Prefer Cline's native file-editing tools for source code changes instead of shell-based text substitutions.

Inspect surrounding code before editing.

Preserve the original file's encoding, line endings, and formatting where possible.

Do not delete a line based solely on its line number without inspecting its contents first.

Run relevant checks after editing, including TypeScript, lint, or build checks when appropriate.

Report command failures honestly; never claim an operation succeeded without verifying it.

Recovery



If a command fails, read the actual PowerShell error, identify the shell incompatibility, and generate a corrected PowerShell command. Never repeat the same invalid command format.

