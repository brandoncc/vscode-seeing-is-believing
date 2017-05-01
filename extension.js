const { commands, window, } = require('vscode');
const SeeingIsBelieving = require('./lib/seeing_is_believing');

function activate(context) {
  const verifyRuby = function() {
    const activeEditor = window.activeTextEditor;

    if (!activeEditor) { return; }
    return activeEditor.document.languageId === 'ruby';
  };
  const disposableToggleMarks = commands.registerCommand('seeing-is-believing.toggle-marks', function () {
    if (!verifyRuby()) { return new Promise((_, rej) => rej('Seeing is Believing can only process Ruby files')); }

    return SeeingIsBelieving.toggleMarks();
  });

  const disposableRun = commands.registerCommand('seeing-is-believing.run', function() {
    if (!verifyRuby()) { return new Promise((_, rej) => rej('Seeing is Believing can only process Ruby files')); }

    return SeeingIsBelieving.run();
  });

  const disposableClean  = commands.registerCommand('seeing-is-believing.clean', function() {
    if (!verifyRuby()) { return new Promise((_, rej) => rej('Seeing is Believing can only process Ruby files')); }

    return SeeingIsBelieving.clean();
  });

  context.subscriptions.push(disposableToggleMarks);
  context.subscriptions.push(disposableRun);
  context.subscriptions.push(disposableClean);
}
exports.activate = activate;
