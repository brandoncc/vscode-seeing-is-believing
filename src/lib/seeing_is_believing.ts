import {window, Range} from "vscode";
import {spawn} from "child_process";
import EditorSelections, {LineSelectionGroups} from "./editor_selections";
import LineTransformer from "./line_transformer";
import {workspace} from "vscode";
import * as os from "os";

const applyTransformations = (selections: LineSelectionGroups) => {
  const editor = window.activeTextEditor;
  const editorSelections = editor?.selections || [];
  let replaceRange;

  if (!window.activeTextEditor) {
    return Promise.reject("There is no active editor");
  }

  return window.activeTextEditor
    .edit(function(editBuilder) {
      selections.forEach(function(selectionGroup) {
        selectionGroup.forEach(function(line) {
          if (!line.transformedText) {
            return;
          }

          replaceRange = new Range(line.number, 0, line.number, line.length);
          editBuilder.replace(replaceRange, line.transformedText);
        });
      });
    })
    .then(
      () => {
        if (!editor) {
          return;
        }

        editor.selections = editorSelections;
      },
      () => {}
    );
};

const callExecutable = (args: Array<string>) => {
  const command = SeeingIsBelieving.command;
  const proc = spawn(command, args, {shell: /^win/.test(os.platform())});
  const editor = window.activeTextEditor;
  const text = editor?.document?.getText();
  const editorSelections = editor?.selections;

  let stdout = "";
  let stderr = "";

  if (!editor) {
    return Promise.resolve();
  }

  return new Promise((res, rej) => {
    proc.on("error", () => {
      window.showErrorMessage(
        `Command '${command}' does not exist. Is it installed?`
      );
      rej(`Command '${command}' does not exist. Is it installed?`);
    });

    proc.stdout.on("data", data => {
      stdout += data;
    });
    proc.stderr.on("data", data => {
      stderr += data;
    });

    proc.on("close", () => {
      if (stderr) {
        window.showErrorMessage(
          `Seeing is Believing encountered an error: ${stderr}`
        );

        if (configuration("halt-run-on-error")) {
          rej(`Seeing is Believing encountered an error: ${stderr}`);
          return;
        }
      }

      if (!text) {
        return Promise.resolve();
      }

      const textLines = text.split(/\r?\n/);
      const textLinesCount = textLines.length;
      const lastLineLength = textLines[textLinesCount - 1].length;

      return editor
        .edit(builder => {
          builder.replace(
            new Range(0, 0, textLinesCount, lastLineLength),
            stdout
          );
        })
        .then(
          () => {
            if (editorSelections) {
              editor.selections = editorSelections;
            }
          },
          () => {}
        )
        .then(
          result => res(result),
          error => rej(error)
        );
    });

    proc.stdin.write(text);
    proc.stdin.end();
  });
};

const configuration = (key: string) =>
  workspace.getConfiguration("seeing-is-believing").get(key);

const SeeingIsBelieving = {
  command: "seeing_is_believing",
  args: function(command: string) {
    switch (command) {
      case "run":
        let argList = [
          "--alignment-strategy",
          "chunk",
          "--number-of-captures",
          "300",
          "--line-length",
          "1000",
          "--timeout",
          "12",
          "--local-cwd",
          "--ignore-unknown-flags"
        ];

        if (
          this.anyLinesAreMarked() ||
          !configuration("annotate-all-if-none-are-marked")
        ) {
          argList.push("--xmpfilter-style");
        }

        if (this.documentFileName()) {
          if (/^win/.test(os.platform())) {
            // If the OS is windows, the command gets piped to a shell. When
            // that happens we need to wrap the path in double quotes to
            // preserve proper handling of spaces.
            argList.push("--as", `"${this.documentFileName()}"`);
          } else {
            argList.push("--as", this.documentFileName() || "");
          }
        }

        return argList;
      case "clean":
        return ["--timeout", "12", "--clean"];
      default:
        return [];
    }
  },
  run: function() {
    return callExecutable(this.args("run"));
  },
  clean: function() {
    if (this.textIsSelected()) {
      const selections = this.getCurrentSelections();

      selections.forEach(function(selectionGroup) {
        selectionGroup.forEach(function(line) {
          const transformer = LineTransformer(line, "remove_mark");
          transformer.transform();
        });
      });

      return applyTransformations(selections);
    } else {
      return callExecutable(this.args("clean"));
    }
  },
  getCurrentSelections: function() {
    if (!window.activeTextEditor) {
      return [];
    }

    return EditorSelections(window.activeTextEditor).get();
  },
  textIsSelected: function() {
    if (!window.activeTextEditor) {
      return false;
    }

    const selections = window.activeTextEditor.selections;

    return (
      selections.length > 1 || selections[0].start.isBefore(selections[0].end)
    );
  },
  anyLinesAreMarked: function() {
    if (!window.activeTextEditor) {
      return false;
    }

    const text = window.activeTextEditor.document.getText();

    return text.match(LineTransformer.markText);
  },

  documentHasFileName: function() {
    return !window?.activeTextEditor?.document?.isUntitled;
  },
  documentFileName: function() {
    return this.documentHasFileName()
      ? window?.activeTextEditor?.document?.fileName
      : null;
  },
  toggleMarks: function() {
    const selections = this.getCurrentSelections();
    const addingMark = !selections.annotated;

    selections.forEach(function(selectionGroup) {
      selectionGroup.forEach(function(line) {
        const transformer = LineTransformer(
          line,
          addingMark ? "add_mark" : "remove_mark"
        );
        transformer.transform();
      });
    });

    return applyTransformations(selections);
  }
};

export default SeeingIsBelieving;
