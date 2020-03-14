const outputMarks = ["# =>", "# !>", "# >>", "# ~>"];

import {SelectedLine} from "./editor_selections";
export const markText = "# =>";

function LineTransformer(line: SelectedLine, transformationType: string) {
  const markText = LineTransformer.markText;
  const removeMarkRegex = new RegExp(
    outputMarks.map(mark => "\\s*" + mark + ".*?(\r\n|\n|$)").join("|")
  );

  return {
    line,
    transformationType,
    markText,

    addMark() {
      const parts = line.text.split(/\s+# =>/);
      parts[1] = parts[1] || ""; // we don't want 'undefined' added to the end of our string

      this.line.transformedText =
        parts[0] + " ".repeat(this.line.padLeft + 2) + markText + parts[1];
    },

    removeAnnotation() {
      this.line.transformedText = line.text.replace(removeMarkRegex, "$1");
    },

    transform: function() {
      switch (this.transformationType) {
        case "add_mark":
          this.addMark();
          break;
        case "remove_mark":
          this.removeAnnotation();
          break;
      }
    }
  };
}

LineTransformer.markText = markText;

export default LineTransformer;
