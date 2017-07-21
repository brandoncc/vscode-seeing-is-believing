# Change Log
All notable changes to the "vscode-seeing-is-believing" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## 0.0.4
- Revert 0.0.3, because I experience problems in certain situations when directories were not writeable.
- Spawn the process in a shell on Windows

## 0.0.3
Write editor contents to a temporary file, then run that file through seeing-is-believing. By doing this, `require_relative` works properly. Previously, the editor contents were written to the stdin of the seeing-is-believing process, but the presence of `require_relative` in the editor text caused an exception.

## 0.0.2
- Don't show error message twice
- Refactor specs to test all commands against execution in non-ruby files
- Rely on VS Code's error message if a command's returned promise is rejected

## 0.0.1
- Initial release
