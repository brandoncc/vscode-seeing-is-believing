import {TextEditor, TextDocument} from "vscode";

export interface SelectedLine {
  number: number;
  text: string;
  length: number;
  lengthWithoutAnnotation: number;
  padLeft: number;
  transformedText?: string;
}

interface SelectedLines extends Array<SelectedLine> {
  [index: number]: SelectedLine;
}

export interface LineSelectionGroups extends Array<SelectedLines> {
  annotated?: boolean;
}

const {markText} = require("./line_transformer");

function EditorSelections(editor: TextEditor) {
  return {
    editor,
    document: editor.document,
    get() {
      const selectionGroups: LineSelectionGroups = [];
      selectionGroups.annotated = false;

      this.editor.selections.forEach((selection, groupNumber) => {
        const lines: SelectedLines = (selectionGroups[groupNumber] = []);
        const startLineNumber = selection.start.line;
        const endLineNumber = selection.end.line;

        for (
          let currentLineNumber = startLineNumber;
          currentLineNumber <= endLineNumber;
          currentLineNumber++
        ) {
          const line = this.document.lineAt(currentLineNumber);

          lines.push({
            number: currentLineNumber,
            text: line.text,
            length: line.text.length,
            lengthWithoutAnnotation: line.text
              .replace(/ # =>.*/, "")
              .trimRight().length,
            padLeft: 0 // default
          });
        }
      });

      selectionGroups.forEach(lines => {
        const longestLine = lines.reduce((longest, line) => {
          return line.lengthWithoutAnnotation > longest
            ? line.lengthWithoutAnnotation
            : longest;
        }, 0);

        lines.forEach(line => {
          line.padLeft = longestLine - line.lengthWithoutAnnotation;
        });
      });

      selectionGroups.annotated = selectionGroups.every(lines => {
        return lines.every(line => line.text.match(markText));
      });

      return selectionGroups;
    }
  };
}

export default EditorSelections;
