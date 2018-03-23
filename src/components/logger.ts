'use strict';

import * as vscode from 'vscode';

import {Extension} from '../main';

export class Logger {
    extension: Extension;
    logPanel: vscode.OutputChannel;
    // status: vscode.StatusBarItem;

    constructor(extension: Extension) {
        this.extension = extension;
        this.logPanel = vscode.window.createOutputChannel('Pandoc Citations');
        // this.status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, -10000);
        // this.status.command = 'citations.actions';
        // this.status.show();
        this.notify('check', 'statusBar.foreground');
    }

    log(message: string) {
        const configuration = vscode.workspace.getConfiguration('pandoc-citations');
        if (configuration.get('debug.log')) {
            this.logPanel.append(`[${new Date().toLocaleTimeString('en-US', {hour12: false})}] ${message}\n`);
        }
    }

    notify(icon: string, color: string, message: string | undefined = undefined, severity: string = 'info') {
        // this.status.text = `$(${icon})`;
        // this.status.tooltip = message;
        // this.status.color = new vscode.ThemeColor(color);
        if (message !== undefined) {
            switch (severity) {
                case 'info':
                    vscode.window.showInformationMessage(message);
                    break;
                case 'warning':
                    vscode.window.showWarningMessage(message);
                    break;
                case 'error':
                    vscode.window.showErrorMessage(message);
                    break;
                default:
                    vscode.window.showErrorMessage(message);
                    break;
            }    
        }
    }

    showLog() {
        this.logPanel.show();
    }
}
