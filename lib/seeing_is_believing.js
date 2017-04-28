const { window, Range } = require('vscode');

const SeeingIsBelieving = {
  markText: '# =>',
  removeMarkRegex: /\s*# =>.*/,
  lineHasMark: function(line) {
    const text = line.text;
    return this.textHasMark(text);
  },
  textHasMark: function(text) {
    return text.match(new RegExp(this.markText));
  },
  addMark: function(line) {
    const parts = line.text.split(/\s+# =>/);
    parts[1] = parts[1] || ''; // we don't want 'undefined' added to the end of our string

    line.text = parts[0] + ' '.repeat(line.padLeft + 1) + this.markText + parts[1];
  },
  removeMark: function(line) {
    line.text = line.text.replace(this.removeMarkRegex, '');
  },
  activeEditor: function() {
    return window.activeTextEditor;
  },
  activeDocument: function() {
    return this.activeEditor().document;
  },
  currentSelections: function() {
    return this.activeEditor().selections;
  },
  toggleMark: function(line, onOrOff) {
    if (onOrOff) {
      this.addMark(line);
    } else {
      this.removeMark(line);
    }
  },
  getSelectedLines: function() {
    const lines = [];
    const activeDocument = this.activeDocument();
    let startLineNumber;
    let endLineNumber;
    let longestLine;
    let line;

    this.currentSelections().forEach(function(selection) {
      startLineNumber = selection.start.line;
      endLineNumber = selection.end.line;

      for (let currentLineNumber = startLineNumber; currentLineNumber <= endLineNumber; currentLineNumber++) {
        line = activeDocument.lineAt(currentLineNumber);

        lines.push({
          number: currentLineNumber,
          text: line.text,
          length: line.text.length,
          lengthWithoutAnnotation: line.text.replace(/(.*)\s+# =>/, '$1').length
        });
      }
    });

    longestLine = lines.reduce(function(longest, line) {
      return line.lengthWithoutAnnotation > longest ? line.lengthWithoutAnnotation : longest;
    }, 0);

    lines.forEach(function(line) {
      line.padLeft = longestLine - line.lengthWithoutAnnotation;
    });

    return lines;
  },
  toggleMarks: function() {
    const self = this;
    const selectedLines = this.getSelectedLines();
    const addingMark = !selectedLines.every(this.lineHasMark.bind(this));
    let replaceRange;

    // toggle the mark on all line objects
    selectedLines.forEach(function(line) {
      self.toggleMark(line, addingMark);
    });

    // apply the text changes to the document
    this.activeEditor().edit(function(editBuilder) {
      selectedLines.forEach(function(line) {
        replaceRange = new Range(line.number, 0, line.number, line.length);
        editBuilder.replace(replaceRange, line.text);
      });
    });
  }
};

module.exports = SeeingIsBelieving;
