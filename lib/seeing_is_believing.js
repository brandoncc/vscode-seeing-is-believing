const { window, Range } = require('vscode');
const spawn = require('child_process').spawn;
const os = require('os');
const EditorSelections = require('./editor_selections');
const LineTransformer = require('./line_transformer');
const { workspace } = require('vscode');

const applyTransformations = (selections) => {
  let replaceRange;

  return window.activeTextEditor.edit(function (editBuilder) {
    selections.forEach(function (selectionGroup) {
      selectionGroup.forEach(function (line) {
        replaceRange = new Range(line.number, 0, line.number, line.length);
        editBuilder.replace(replaceRange, line.transformedText);
      });
    });
  });
};

const callExecutable = (args) => {
  const command = SeeingIsBelieving.command;
  const proc = spawn(command, args, { shell: /^win/.test(os.platform()) });
  const text = window.activeTextEditor.document.getText();

  let stdout = '';
  let stderr = '';

  return new Promise((res, rej) => {
    proc.on('error', () => {
      window.showErrorMessage(`Command '${command}' does not exist. Is it installed?`);
      rej(`Command '${command}' does not exist. Is it installed?`);
    });

    proc.stdout.on('data', data => { stdout += data; });
    proc.stderr.on('data', data => { stderr += data; });

    proc.on('close', () => {
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
      }).then(result => res(result), error => rej(error));
    });

    proc.stdin.write(text);
    proc.stdin.end();
  });
};

const configuration = (key) => (
  workspace.getConfiguration('seeing-is-believing').get(key)
);

const SeeingIsBelieving = {
  command: 'seeing_is_believing',
  args: function (command) {
    switch (command) {
      case 'run':
        let argList = [
          '--alignment-strategy', 'chunk',
          '--number-of-captures', '300',
          '--line-length', '1000',
          '--timeout', '12',
          '--local-cwd',
          '--ignore-unknown-flags'
        ];

        if (this.anyLinesAreMarked() || !configuration('annotate-all-if-none-are-marked')) {
          argList.push('--xmpfilter-style');
        }

        if (this.documentFileName()) {
          argList.push('--as', this.documentFileName());
        }

        return argList;
      case 'clean':
        return [
          '--timeout', '12',
          '--clean'
        ];
    };
  },
  run: function () {
    return callExecutable(this.args('run'));
  },
  clean: function () {
    if (this.textIsSelected()) {
      const selections = this.getCurrentSelections();

      selections.forEach(function (selectionGroup) {
        selectionGroup.forEach(function (line) {
          const transformer = new LineTransformer(line, 'remove_mark');
          transformer.transform();
        });
      });

      return applyTransformations(selections);
    } else {
      return callExecutable(this.args('clean'));
    }
  },
  getCurrentSelections: function () {
    return (new EditorSelections(window.activeTextEditor)).get();
  },
  textIsSelected: function () {
    const selections = window.activeTextEditor.selections;

    return selections.length > 1 || selections[0].start.isBefore(selections[0].end);
  },
  anyLinesAreMarked: function () {
    const text = window.activeTextEditor.document.getText();

    return text.match(LineTransformer.markText);
  },

  documentHasFileName: function () {
    return !window.activeTextEditor.document.isUntitled;
  },
  documentFileName: function () {
    return this.documentHasFileName()
      ? window.activeTextEditor.document.fileName
      : null;
  },
  toggleMarks: function () {
    const selections = this.getCurrentSelections();
    const addingMark = !selections.annotated;

    selections.forEach(function (selectionGroup) {
      selectionGroup.forEach(function (line) {
        const transformer = new LineTransformer(line, (addingMark ? 'add_mark' : 'remove_mark'));
        transformer.transform();
      });
    });

    return applyTransformations(selections);
  }
};

module.exports = SeeingIsBelieving;
