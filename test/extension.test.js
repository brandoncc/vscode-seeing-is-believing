/* global describe, before, beforeEach, after, afterEach, it */

const { commands, window, workspace, Uri } = require('vscode');

const { assert, expect } = require('chai');
const sinon  = require('sinon');
const path = require('path');

const extension = require('../extension');

describe("Extension Tests", function() {
  afterEach(function(done) {
      commands.executeCommand('workbench.action.closeActiveEditor').then(function() {
        setTimeout(done, 100); // We get failures if we don't allow a little time after closing
      }, function() {
        done(new Error('Failed to close active editor'));
      });
  });

  function fileToUri(fileName) {
    return Uri.parse('file://' + path.join(workspace.rootPath, fileName));
  }

  function openFile(fileName, doneCallback) {
    return workspace.openTextDocument(fileToUri(fileName)).then(function(doc) {
      return window.showTextDocument(doc);
    },function() {
      doneCallback(new Error("Unable to open " + fileName));
    });
  }

  describe("commands", function() {
    it("work in ruby files", function(done) {
      const spy = sinon.spy(window, 'showErrorMessage');

      openFile('sample.rb', done).then(function() {
        commands.executeCommand('seeing-is-believing.toggle-marks').then(function() {
          expect(spy.notCalled).to.equal(true);
          spy.restore();
          done();
        }, function() {
          spy.restore();
          done(new Error('Failed to execute command'));
        });
      }, function() {
        spy.restore();
        done(new Error('Failed to open file'));
      });
    });

    it("don't work in other files", function(done) {
      const spy = sinon.spy(window, 'showErrorMessage');

      openFile('sample.js', done).then(function() {
        commands.executeCommand('seeing-is-believing.toggle-marks').then(function() {
          spy.restore();
          done('Should have failed to execute command');
        }, function() {
          expect(spy.calledOnce).to.equal(true);
          spy.restore();
          done();
        });
      }, function() {
        spy.restore();
        done(new Error('Failed to open file'));
      });
    });
  });

  describe("annotations", function() {
    describe("adding", function() {
      beforeEach(function(done) {
        openFile('sample.rb', done).then(function() {
          done();
        }, function() {
          done(new Error('Failed to open file'));
        });
      });

      it("adds the annotation mark to the current line", function(done) {
        const document = window.activeTextEditor.document;

        commands.executeCommand('seeing-is-believing.toggle-marks').then(function() {
          expect(document.lineAt(0).text).to.equal('first_name = "Jordan" # =>');
          done();
        }, function() {
          done(new Error('Failed to execute command'));
        });
      });

      it("adds the annotation mark to multiple lines", function(done) {
        const document = window.activeTextEditor.document;

        commands.executeCommand('cursorTop').then(function() {
          commands.executeCommand('editor.action.insertCursorBelow').then(function() {
            commands.executeCommand('seeing-is-believing.toggle-marks').then(function() {
              expect(document.lineAt(0).text).to.equal('first_name = "Jordan" # =>');
              expect(document.lineAt(1).text).to.equal('last_name = "Simone"  # =>');
              done();
            }, function() {
              done(new Error('Failed to execute command'));
            });
          }, function() {
            done(new Error('Failed to execute command'));
          });
        }, function() {
          done(new Error('Failed to execute command'));
        });
      });

      it("adds the annotation mark to unmarked lines when some of selection is marked", function(done) {
        const document = window.activeTextEditor.document;

        commands.executeCommand('cursorTop').then(function() {
          commands.executeCommand('cursorDown').then(function() {
            commands.executeCommand('cursorDown').then(function() {
              commands.executeCommand('seeing-is-believing.toggle-marks').then(function() {
                expect(document.lineAt(0).text).to.equal('first_name = "Jordan"');
                expect(document.lineAt(1).text).to.equal('last_name = "Simone"');
                expect(document.lineAt(2).text).to.equal('dob = "1/23/80" # =>');

                commands.executeCommand('editor.action.insertCursorAbove').then(function() {
                  commands.executeCommand('editor.action.insertCursorAbove').then(function() {
                    commands.executeCommand('seeing-is-believing.toggle-marks').then(function() {
                      expect(document.lineAt(0).text).to.equal('first_name = "Jordan" # =>');
                      expect(document.lineAt(1).text).to.equal('last_name = "Simone"  # =>');
                      expect(document.lineAt(2).text).to.equal('dob = "1/23/80"       # =>');

                      done();
                    }, function() {
                      done(new Error('Failed to execute command'));
                    });
                  }, function() {
                    done(new Error('Failed to execute command'));
                  });
                }, function() {
                  done(new Error('Failed to execute command'));
                });
              }, function() {
                done(new Error('Failed to execute command'));
              });
            }, function() {
              done(new Error('Failed to execute command'));
            });
          }, function() {
            done(new Error('Failed to execute command'));
          });
        }, function() {
          done(new Error('Failed to execute command'));
        });
      });

      it("aligns annotation new groups of marks", function(done) {
        const document = window.activeTextEditor.document;

        commands.executeCommand('cursorTop').then(function() {
          commands.executeCommand('editor.action.insertCursorBelow').then(function() {
            commands.executeCommand('editor.action.insertCursorBelow').then(function() {
              commands.executeCommand('seeing-is-believing.toggle-marks').then(function() {
                expect(document.lineAt(0).text).to.equal('first_name = "Jordan" # =>');
                expect(document.lineAt(1).text).to.equal('last_name = "Simone"  # =>');
                expect(document.lineAt(2).text).to.equal('dob = "1/23/80"       # =>');

                done();
              }, function() {
                done(new Error('Failed to execute command'));
              });
            }, function() {
              done(new Error('Failed to execute command'));
            });
          }, function() {
            done(new Error('Failed to execute command'));
          });
        }, function() {
          done(new Error('Failed to execute command'));
        });
      });
    });

    describe("removing", function() {
      beforeEach(function(done) {
        openFile('sample-marked.rb', done).then(function() {
          done();
        }, function() {
          done(new Error('Failed to open file'));
        });
      });

      it("removes the annotation from the current line", function(done) {
        const document = window.activeTextEditor.document;

        commands.executeCommand('cursorTop').then(function() {
          commands.executeCommand('seeing-is-believing.toggle-marks').then(function() {
            expect(document.lineAt(0).text).to.equal('first_name = "Jordan"');

            done();
          }, function() {
            done(new Error('Failed to execute command'));
          });
        }, function() {
          done(new Error('Failed to execute command'));
        });
      });

      it("removes the annotation from multiple lines", function(done) {
        const document = window.activeTextEditor.document;

        commands.executeCommand('cursorTop').then(function() {
          commands.executeCommand('editor.action.insertCursorBelow').then(function() {
            commands.executeCommand('seeing-is-believing.toggle-marks').then(function() {
              expect(document.lineAt(0).text).to.equal('first_name = "Jordan"');
              expect(document.lineAt(1).text).to.equal('last_name = "Simone"');

              done();
            }, function() {
              done(new Error('Failed to execute command'));
            });
          }, function() {
            done(new Error('Failed to execute command'));
          });
        }, function() {
          done(new Error('Failed to execute command'));
        });
      });
    });
  });
});
