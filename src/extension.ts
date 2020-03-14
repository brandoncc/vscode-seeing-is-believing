// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {window, commands, ExtensionContext} from "vscode";

import SeeingIsBelieving from "./lib/seeing_is_believing";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
  const verifyRuby = function() {
    const activeEditor = window.activeTextEditor;
    if (!activeEditor) {
      return;
    }
    return activeEditor.document.languageId === "ruby";
  };
  const disposableToggleMarks = commands.registerCommand(
    "seeing-is-believing.toggle-marks",
    function() {
      if (!verifyRuby()) {
        return new Promise((_, rej) =>
          rej("Seeing is Believing can only process Ruby files")
        );
      }
      return SeeingIsBelieving.toggleMarks();
    }
  );
  const disposableRun = commands.registerCommand(
    "seeing-is-believing.run",
    function() {
      if (!verifyRuby()) {
        return new Promise((_, rej) =>
          rej("Seeing is Believing can only process Ruby files")
        );
      }
      return SeeingIsBelieving.run();
    }
  );
  const disposableClean = commands.registerCommand(
    "seeing-is-believing.clean",
    function() {
      if (!verifyRuby()) {
        return new Promise((_, rej) =>
          rej("Seeing is Believing can only process Ruby files")
        );
      }
      return SeeingIsBelieving.clean();
    }
  );
  context.subscriptions.push(disposableToggleMarks);
  context.subscriptions.push(disposableRun);
  context.subscriptions.push(disposableClean);
}

// this method is called when your extension is deactivated
export function deactivate() {}
