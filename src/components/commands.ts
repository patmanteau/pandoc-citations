'use strict';

import * as vscode from 'vscode';

import {Extension} from '../main';

export class Commands {
    extension: Extension;

    constructor(extension: Extension) {
        this.extension = extension;
    }

    sayHello() {
        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World!');
    }
}