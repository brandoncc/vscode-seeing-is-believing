/* global describe, before, beforeEach, after, afterEach, it, context */

const { commands, window, workspace, Uri } = require('vscode');

const { assert, expect } = require('chai');
const sinon  = require('sinon');
const path = require('path');

const extension = require('../extension');
const SeeingIsBelieving = require('../lib/seeing_is_believing');

describe("Integration tests", function() {
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

    const extensionCommands = ['toggle-marks', 'clean', 'run'];

    extensionCommands.forEach(function(command) {
      it(`won't run seeing-is-believing.${command} in other files`, function(done) {
        openFile('sample.js', done).then(function() {

          commands.executeCommand(`seeing-is-believing.${command}`).then(function() {
            done('Should have failed to execute command');
          }, function(error) {
            expect(error).to.equal('Seeing is Believing can only process Ruby files');
            done();
          });
        }, function() {
          done(new Error('Failed to open file'));
        });
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
          expect(document.lineAt(0).text).to.equal('first_name = "Jordan"  # =>');
          done();
        }, function() {
          done(new Error('Failed to execute command'));
        });
      });

      context("some lines are annotated", function() {
        it("adds the annotation mark to unmarked lines in the same selection group", function(done) {
          const document = window.activeTextEditor.document;

          commands.executeCommand('cursorTop').then(function() {
            commands.executeCommand('cursorDown').then(function() {
              commands.executeCommand('cursorDown').then(function() {
                commands.executeCommand('seeing-is-believing.toggle-marks').then(function() {
                  expect(document.lineAt(0).text).to.equal('first_name = "Jordan"');
                  expect(document.lineAt(1).text).to.equal('last_name = "Simone"');
                  expect(document.lineAt(2).text).to.equal('dob = "1/23/80"  # =>');

                  commands.executeCommand('cursorUpSelect').then(function() {
                    commands.executeCommand('cursorUpSelect').then(function() {
                      commands.executeCommand('seeing-is-believing.toggle-marks').then(function() {
                        expect(document.lineAt(0).text).to.equal('first_name = "Jordan"  # =>');
                        expect(document.lineAt(1).text).to.equal('last_name = "Simone"   # =>');
                        expect(document.lineAt(2).text).to.equal('dob = "1/23/80"        # =>');

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

        it("adds the annotation mark to unmarked lines in the other selection groups", function(done) {
          const document = window.activeTextEditor.document;

          commands.executeCommand('cursorTop').then(function() {
            commands.executeCommand('seeing-is-believing.toggle-marks').then(function() {
              expect(document.lineAt(0).text).to.equal('first_name = "Jordan"  # =>');
              expect(document.lineAt(1).text).to.equal('last_name = "Simone"');
              expect(document.lineAt(2).text).to.equal('dob = "1/23/80"');

              commands.executeCommand('editor.action.insertCursorBelow').then(function() {
                commands.executeCommand('cursorRightSelect').then(function() {
                  commands.executeCommand('seeing-is-believing.toggle-marks').then(function() {
                    expect(document.lineAt(0).text).to.equal('first_name = "Jordan"  # =>');
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
            }, function() {
              done(new Error('Failed to execute command'));
            });
          }, function() {
            done(new Error('Failed to execute command'));
          });
        });
      });

      context("adds the annotation mark to multiple lines", function(done) {
        it("aligns marks in the same selection group", function(done) {
          const document = window.activeTextEditor.document;

          commands.executeCommand('cursorTop').then(function() {
            commands.executeCommand('cursorDownSelect').then(function() {
              commands.executeCommand('cursorDownSelect').then(function() {
                commands.executeCommand('seeing-is-believing.toggle-marks').then(function() {
                  expect(document.lineAt(0).text).to.equal('first_name = "Jordan"  # =>');
                  expect(document.lineAt(1).text).to.equal('last_name = "Simone"   # =>');
                  expect(document.lineAt(2).text).to.equal('dob = "1/23/80"        # =>');

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

        it("does not align different selection groups", function(done) {
          const document = window.activeTextEditor.document;

          commands.executeCommand('cursorTop').then(function() {
            commands.executeCommand('editor.action.insertCursorBelow').then(function() {
              commands.executeCommand('editor.action.insertCursorBelow').then(function() {
                commands.executeCommand('seeing-is-believing.toggle-marks').then(function() {
                  expect(document.lineAt(0).text).to.equal('first_name = "Jordan"  # =>');
                  expect(document.lineAt(1).text).to.equal('last_name = "Simone"  # =>');
                  expect(document.lineAt(2).text).to.equal('dob = "1/23/80"  # =>');

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
      });;
    });;

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

  describe("require relative files", function() {
    beforeEach(function(done) {
      openFile('requirer.rb', done).then(function() {
        done();
      }, function() {
        done(new Error('Failed to open file'));
      });
    });

    it("works properly", function(done) {
      const firstLine = () => window.activeTextEditor.document.getText().split(/\r?\n/)[0];

      expect(firstLine()).to.eq("require_relative 'requiree'");

      commands.executeCommand('seeing-is-believing.run').then(function() {
        expect(firstLine()).to.eq("require_relative 'requiree'  # => true");

        done();
      }, function() {
        done(new Error('Failed to execute command'));
      });
    });
  });

  describe("run and clean", function() {
    beforeEach(function(done) {
      openFile('sample.rb', done).then(function() {
        done();
      }, function() {
        done(new Error('Failed to open file'));
      });
    });

    it("displays an error if the executable is unavailable", function(done) {
      const spy = sinon.spy(window, 'showErrorMessage');
      const cachedCommand = SeeingIsBelieving.command;
      SeeingIsBelieving.command = 'fake_command';

      commands.executeCommand('seeing-is-believing.run').then(function() {
        spy.restore();
        SeeingIsBelieving.command = cachedCommand;
        done(new Error('Should have failed to execute command'));
      }, function() {
        expect(spy.calledWith(`Command 'fake_command' does not exist. Is it installed?`)).to.equal(true);
        spy.restore();
        SeeingIsBelieving.command = cachedCommand;
        done();
      });
    });

    it("updates the document text and then cleans it", function(done) {
      const lines = () => window.activeTextEditor.document.getText().split(/\r?\n/);
      const linesWithText = () => lines().filter(line => line.trim() !== '');
      const lastLineWithText = () => linesWithText()[linesWithText().length - 1];

      expect(lastLineWithText()).to.eq('puts "My name is #{first_name} and I was born #{dob}"');

      commands.executeCommand('seeing-is-believing.run').then(function() {
        expect(lastLineWithText()).to.eq("# >> My name is Jordan and I was born 1/23/80");

        commands.executeCommand('seeing-is-believing.clean').then(function() {
          expect(lastLineWithText()).to.eq('puts "My name is #{first_name} and I was born #{dob}"');

          done();
        }, function() {
          done(new Error('Failed to execute command'));
        });
      }, function() {
        done(new Error('Failed to execute command'));
      });
    });

    context("xmpfilter-style is disabled if none marked", function() {
      it("annotates the whole document if no lines are marked", function(done) {
        const document = window.activeTextEditor.document;
        const stub = sinon.stub(workspace, 'getConfiguration');
        stub.withArgs('seeing-is-believing').returns({
          get: function(key) {
            if (key === 'annotate-all-if-none-are-marked') { return true; }
            else { done(new Error('Wrong key was attempted to be retrieved')) }
          }
        });

        commands.executeCommand('seeing-is-believing.run').then(function() {
          expect(document.lineAt(0).text).to.eq('first_name = "Jordan"  # => "Jordan"');
          expect(document.lineAt(1).text).to.eq('last_name = "Simone"   # => "Simone"');
          expect(document.lineAt(2).text).to.eq('dob = "1/23/80"        # => "1/23/80"');
          expect(document.lineAt(3).text).to.eq('');
          expect(document.lineAt(4).text).to.eq('puts "My name is #{first_name} and I was born #{dob}"  # => nil');
          expect(document.lineAt(5).text).to.eq('');
          expect(document.lineAt(6).text).to.eq('# >> My name is Jordan and I was born 1/23/80');

          stub.restore();
          done();
        }, function() {
          stub.restore();
          done(new Error('Failed to execute command'));
        });
      });

      it("only annotates marked lines if any are marked", function(done) {
        const document = window.activeTextEditor.document;
        const stub = sinon.stub(workspace, 'getConfiguration');
        stub.withArgs('seeing-is-believing').returns({
          get: function(key) {
            if (key === 'annotate-all-if-none-are-marked') { return true; }
            else { done(new Error('Wrong key was attempted to be retrieved')) }
          }
        });

        commands.executeCommand('cursorTop').then(function() {
          commands.executeCommand('cursorDownSelect').then(function() {
            commands.executeCommand('seeing-is-believing.toggle-marks').then(function() {
              commands.executeCommand('seeing-is-believing.run').then(function() {
                expect(document.lineAt(0).text).to.eq('first_name = "Jordan"  # => "Jordan"');
                expect(document.lineAt(1).text).to.eq('last_name = "Simone"   # => "Simone"');
                expect(document.lineAt(2).text).to.eq('dob = "1/23/80"');
                expect(document.lineAt(3).text).to.eq('');
                expect(document.lineAt(4).text).to.eq('puts "My name is #{first_name} and I was born #{dob}"');
                expect(document.lineAt(5).text).to.eq('');
                expect(document.lineAt(6).text).to.eq('# >> My name is Jordan and I was born 1/23/80');

                stub.restore();
                done();
              }, function() {
                stub.restore();
                done(new Error('Failed to execute command'));
              });
            }, function() {
              stub.restore();
              done(new Error('Failed to execute command'));
            });
          }, function() {
            stub.restore();
            done(new Error('Failed to execute command'));
          });
        }, function() {
          stub.restore();
          done(new Error('Failed to execute command'));
        });
      });
    });

    it("cleans selected lines", function(done) {
      const document = window.activeTextEditor.document;

      commands.executeCommand('cursorTop').then(function() {
        commands.executeCommand('cursorDownSelect').then(function() {
          commands.executeCommand('cursorDownSelect').then(function() {
            commands.executeCommand('seeing-is-believing.toggle-marks').then(function() {
              expect(document.lineAt(0).text).to.equal('first_name = "Jordan"  # =>');
              expect(document.lineAt(1).text).to.equal('last_name = "Simone"   # =>');
              expect(document.lineAt(2).text).to.equal('dob = "1/23/80"        # =>');

              commands.executeCommand('cursorTop').then(function() {
                commands.executeCommand('cursorDownSelect').then(function() {
                  commands.executeCommand('seeing-is-believing.clean').then(function() {
                    expect(document.lineAt(0).text).to.equal('first_name = "Jordan"');
                    expect(document.lineAt(1).text).to.equal('last_name = "Simone"');
                    expect(document.lineAt(2).text).to.equal('dob = "1/23/80"        # =>');

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
  });
});
