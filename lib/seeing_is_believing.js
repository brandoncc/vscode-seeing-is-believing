const { window, Range } = require('vscode');
const spawn = require('child_process').spawn;
const EditorSelections = require('./editor_selections');
const LineTransformer = require('./line_transformer');

const callExecutable = (args) => {
  const command = SeeingIsBelieving.command;
  const proc = spawn(command, args);
  const text = window.activeTextEditor.document.getText();

  let stdout = '';
  let stderr = '';

  return new Promise((res, rej) => {
    proc.on('error', () => {
      window.showErrorMessage(`Command '${command}' does not exist. Is it installed?`);
      rej(`Command '${command}' does not exist. Is it installed?`);
      return;
    });

    proc.stdout.on('data', data => stdout += data);
    proc.stderr.on('data', data => stderr += data);

    proc.on('close', status => {
      if (stderr) {
        window.showErrorMessage(`Seeing is Believing encountered an error: ${stderr}`);
        rej(`Seeing is Believing encountered an error: ${stderr}`);
        return;
      }

      const textLines = text.split(/\r?\n/);
      const textLinesCount = textLines.length;
      const lastLineLength = textLines[textLinesCount - 1].length;

      return window.activeTextEditor.edit(builder => {
        builder.replace(new Range(0, 0, textLinesCount, lastLineLength), stdout);
      }).then(result => {
          res(result);
      }, error => {
        rej(error);
      });
    });

    proc.stdin.write(text);
    proc.stdin.end();
  });
};

const SeeingIsBelieving = {
  command: 'seeing_is_believing',
  args: {
    'run': ['-x',
            '-t 10'],
    'clean': ['--clean']
  },
  run: function() {
    return callExecutable(this.args.run);
  },
  clean: function() {
    return callExecutable(this.args.clean);
  },
  toggleMarks: function() {
    const selections = (new EditorSelections(window.activeTextEditor)).get();
    const addingMark = !selections.annotated;
    let replaceRange;

    // toggle the mark on all selected lines
    selections.forEach(function(selectionGroup) {
      selectionGroup.forEach(function(line) {
        const transformer = new LineTransformer(line, (addingMark ? 'add_mark' : 'remove_mark'));
        transformer.transform();
      });
    });

    // apply the text changes to the document
    return window.activeTextEditor.edit(function(editBuilder) {
      selections.forEach(function(selectionGroup) {
        selectionGroup.forEach(function(line) {
          replaceRange = new Range(line.number, 0, line.number, line.length);
          editBuilder.replace(replaceRange, line.transformedText);
        });
      })
    });
  }
};

module.exports = SeeingIsBelieving;
