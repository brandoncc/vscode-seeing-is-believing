# Seeing is Believing Integration for Visual Studio Code

This extension integrates
[seeing_is_believing](https://github.com/JoshCheek/seeing_is_believing) with
Visual Studio Code.

## Usage

### Available Commands

#### Seeing is Believing: Mark/Unmark Line(s) for Annotation

If you want to see what a line returns, this is how you mark it to be annotated.

#### Seeing is Believing: Run

If no lines are marked for annotation, the only change caused by running Seeing
is Believing will be the output of stdout/stderr at the bottom of the document.
If neither of those streams have any content, there will be no visible change to
the document.

Please note the default behavior of only annotating marked lines can be changed.
For more information see the [Features](#features) section.

#### Seeing is Believing: Clean

Removes all annotations as well as stream output from the bottom of the
document.

## Options

By default, `--xmpfilter-style` is enabled all the time. If you would like to
disable it when there are no lines marked for annotation, you can change the
`seeing-is-believing.annotate-all-if-none-are-marked` setting to `true`.

If the `seeing_is_believing` binary execution has any content in stderr, the
"Run" command will terminate without making any changes. This is for safety, but
may be overkill or interfere with the extension functioning properly. You can
tell the extension to continue if it experiences any errors by setting
`seeing-is-believing.halt-run-on-error` to `false`.

## Requirements

`seeing_is_believing` is required. You can install it with
`gem install seeing_is_believing`.

## Known Issues

`seeing_is_believing` prior to version 4.0 has a warning when run on Ruby 2.7.0.
That error looks like this:

```
/Users/brandoncc/.rbenv/versions/2.7.0/lib/ruby/gems/2.7.0/gems/parser-2.5.3.0/lib/parser/source/tree_rewriter.rb:269: warning: Using the last argument as keyword parameters is deprecated; maybe ** should be added to the call
/Users/brandoncc/.rbenv/versions/2.7.0/lib/ruby/gems/2.7.0/gems/parser-2.5.3.0/lib/parser/source/tree_rewriter/action.rb:16: warning: The called method `initialize' is defined here
```

If you experience this, turn off `seeing-is-believing.halt-run-on-error` and
turn on `seeing-is-believing.annotate-all-if-none-are-marked`. That should allow
the extension to function properly, although it will not fix the errors/warnings
until `seeing_is_believing` itself is fixed.

The recommended solution is to upgrade to version 4.0 or higher of the gem, if
you are able to.

## Release Notes

See the [change log](CHANGELOG.md)
