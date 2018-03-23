'use strict';

import * as vscode from 'vscode';
import * as path from 'path';

import {Logger} from './components/logger';
import {Completer} from './components/completer';

export class Extension {
    packageInfo: any;
    extensionRoot: string;
    logger: Logger;
    completer: Completer;

    constructor() {
        this.extensionRoot = path.resolve(`${__dirname}/../`);
        this.logger = new Logger(this);
        this.completer = new Completer(this);

        this.logger.log('[@Pandoc_Citations_2018, pp. 42] initialized.');
    }
}

export function activate(context: vscode.ExtensionContext) {

    const extension = new Extension();

    // commands
    context.subscriptions.push(vscode.commands.registerCommand('main.insertCitekey', () => {
        extension.completer.citations.browseAndInsertCitekey();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('main.insertBracketedCitation', () => {
        extension.completer.citations.browseAndInsertBracketedCitation();
    }));

    // completion
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(['markdown', 'pfm', 'rmd'], extension.completer, '@'));
}

export function deactivate() {
}

