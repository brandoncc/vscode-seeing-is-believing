# Seeing is Believing Integration for Visual Studio Code

This extension integrates [seeing_is_believing](https://github.com/JoshCheek/seeing_is_believing) with Visual Studio Code.

## Usage

### Available Commands

#### Seeing is Believing: Mark/Unmark Line(s) for Annotation

If you want to see what a line returns, this is how you mark it to be annotated.

#### Seeing is Believing: Run

If no lines are marked for annotation, the only change caused by running Seeing is Believing will be the output of stdout/stderr at the bottom of the document. If neither of those streams have any content, there will be no visible change to the document.

Please note the default behavior of only annotating marked lines can be changed. For more information see the [Features](#features) section.
#### Seeing is Believing: Clean

Removes all annotations as well as stream output from the bottom of the document.

## Features

By default, `--xmpfilter-style` is enabled all the time. If you would like to disable it when there are no lines marked for annotation, you can change the `seeing-is-believing.annotate-all-if-none-are-marked` setting to `true`.

## Requirements

`seeing_is_believing` is required. You can install it with `gem install seeing_is_believing`.

## Known Issues

None yet, feel free to create an issue if you find a problem.

## Release Notes

See the [change log](CHANGELOG.md)
