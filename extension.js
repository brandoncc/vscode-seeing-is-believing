const { commands, window, } = require('vscode');
const SeeingIsBelieving = require('./lib/seeing_is_believing');

function activate(context) {
  var disposable = commands.registerCommand('seeing-is-believing.toggle-marks', function () {
    const activeEditor = window.activeTextEditor;

    if (!activeEditor) { return; }
    if (activeEditor.document.languageId !== 'ruby') {
      window.showErrorMessage('Seeing is Believing can only process Ruby files.');
      return;
    }

    SeeingIsBelieving.toggleMarks();
  });

  context.subscriptions.push(disposable);
}
exports.activate = activate;
