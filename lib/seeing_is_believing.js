const { window, Range } = require('vscode');
const spawn = require('child_process').spawn;
const path = require('path')
const fs = require('fs');
const EditorSelections = require('./editor_selections');
const LineTransformer = require('./line_transformer');
const { workspace } = require('vscode');

const applyTransformations = (selections) => {
  let replaceRange;

  return window.activeTextEditor.edit(function(editBuilder) {
    selections.forEach(function(selectionGroup) {
      selectionGroup.forEach(function(line) {
        replaceRange = new Range(line.number, 0, line.number, line.length);
        editBuilder.replace(replaceRange, line.transformedText);
      });
    })
  });
};

const getRandomString = () => {
  // http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const getNewTemporaryFileName = () => {
  const directory = path.dirname(window.activeTextEditor.document.fileName);
  const extension = path.extname(window.activeTextEditor.document.fileName)
  let newFileName = '';


  while(newFileName === '' || fs.existsSync(newFileName)) {
    newFileName = directory + "/" + getRandomString() + extension;
  }

  return newFileName;
};

const saveCopy = () => {
  const text = window.activeTextEditor.document.getText();
  const temporaryFileName = getNewTemporaryFileName();

  fs.writeFileSync(temporaryFileName, text);

  return temporaryFileName
};

const callExecutable = (args) => {
  // Write a copy of the file rather than streaming it through as text. This
  // allows require_relative to function properly.
  const copyFileName = saveCopy();
  const command = SeeingIsBelieving.command;
  const proc = spawn(command, args.concat(copyFileName));
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
      fs.unlink(copyFileName);

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

    proc.stdin.end();
  });
};

const configuration = (key) => (
  workspace.getConfiguration('seeing-is-believing').get(key)
);

const SeeingIsBelieving = {
  command: 'seeing_is_believing',
  args: function(command) {
    switch (command) {
      case 'run':
        let argList = ['-t 10'];

        if (this.anyLinesAreMarked() || !configuration('annotate-all-if-none-are-marked')) {
          argList.push('--xmpfilter-style');
        }

        return argList;
      case 'clean':
        return ['-t 10', '--clean'];
    };
  },
  run: function() {
    return callExecutable(this.args('run'));
  },
  clean: function() {
    if (this.textIsSelected()) {
      const selections = this.getCurrentSelections();

      selections.forEach(function(selectionGroup) {
        selectionGroup.forEach(function(line) {
          const transformer = new LineTransformer(line, 'remove_mark');
          transformer.transform();
        });
      })

      return applyTransformations(selections);
    } else {
      return callExecutable(this.args('clean'));
    }
  },
  getCurrentSelections: function() {
    return (new EditorSelections(window.activeTextEditor)).get();
  },
  textIsSelected: function() {
    const selections = window.activeTextEditor.selections;

    return selections.length > 1 || selections[0].start.isBefore(selections[0].end);
  },
  anyLinesAreMarked: function() {
    const text = window.activeTextEditor.document.getText();

    return text.match(LineTransformer.markText);
  },
  toggleMarks: function() {
    const selections = this.getCurrentSelections();
    const addingMark = !selections.annotated;

    selections.forEach(function(selectionGroup) {
      selectionGroup.forEach(function(line) {
        const transformer = new LineTransformer(line, (addingMark ? 'add_mark' : 'remove_mark'));
        transformer.transform();
      });
    });

    return applyTransformations(selections);
  }
};

module.exports = SeeingIsBelieving;
