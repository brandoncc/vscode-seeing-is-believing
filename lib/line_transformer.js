function LineTransformer(line, transformationType) {
  const markText = LineTransformer.markText;
  const removeMarkRegex = new RegExp('\\s*' + markText + '.*?(\r\n|\n|$)');

  this.line = line;
  this.transformationType = transformationType;

  this.addMark = function() {
    const parts = line.text.split(/\s+# =>/);
    parts[1] = parts[1] || ''; // we don't want 'undefined' added to the end of our string

    line.transformedText = parts[0] + ' '.repeat(line.padLeft + 1) + markText + parts[1];
  }

  this.removeAnnotation = function() {
    line.transformedText = line.text.replace(removeMarkRegex, '$1');
  }
}

LineTransformer.markText = '# =>';

LineTransformer.prototype.transform = function() {
  switch (this.transformationType) {
    case 'add_mark':
      this.addMark();
      break;
    case 'remove_mark':
      this.removeAnnotation();
      break;
  }
};

module.exports = LineTransformer;