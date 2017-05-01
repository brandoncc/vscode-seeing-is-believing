const { window, Range } = require('vscode');
const exec = require('child_process').exec;
const EditorSelections = require('./editor_selections');
const LineTransformer = require('./line_transformer');

const SeeingIsBelieving = {
  run: function() {
    exec('seeing_is_believing -e 1 + 1', (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
    });
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
