const { markText } = require('./line_transformer');

function EditorSelections (editor) {
  this.editor = editor;
  this.document = editor.document;
}

EditorSelections.prototype.get = function () {
  const selectionGroups = [];
  selectionGroups.annotated = false;

  this.editor.selections.forEach((selection, groupNumber) => {
    const lines = selectionGroups[groupNumber] = [];
    const startLineNumber = selection.start.line;
    const endLineNumber = selection.end.line;

    for (let currentLineNumber = startLineNumber; currentLineNumber <= endLineNumber; currentLineNumber++) {
      const line = this.document.lineAt(currentLineNumber);

      lines.push({
        number: currentLineNumber,
        text: line.text,
        length: line.text.length,
        lengthWithoutAnnotation: line.text.replace(/ # =>.*/, '').trimRight().length
      });
    }
  });

  selectionGroups.forEach(lines => {
    const longestLine = lines.reduce((longest, line) => {
      return line.lengthWithoutAnnotation > longest ? line.lengthWithoutAnnotation : longest;
    }, 0);

    lines.forEach(line => {
      line.padLeft = longestLine - line.lengthWithoutAnnotation;
    });
  });

  selectionGroups.annotated = selectionGroups.every(lines => {
    return lines.every(line => line.text.match(markText));
  });

  return selectionGroups;
};

module.exports = EditorSelections;
