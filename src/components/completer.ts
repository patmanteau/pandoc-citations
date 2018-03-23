'use strict';

import * as vscode from 'vscode';
import * as moment from 'moment';
import * as fs from 'fs-extra';
import * as path from 'path';
import {Md5} from 'ts-md5';

import {expandString} from '../util';

/// <amd-dependency path="model/tree" />
declare var require:(moduleId:string) => any;
let Cite = require('citation-js');

import {Extension} from '../main';

class CitationItem {
    protected csl: any;
    protected bibName: string;

    constructor(bibName: string) {
        this.bibName = bibName;
    }

    static fromCslJsonObj(bibName: string, csl: any): CitationItem {
        let item = new CitationItem(bibName);
        item.csl = csl;
        return item;
    }

    asFormattedMap(): Map<string, string| vscode.MarkdownString> {
        const config = vscode.workspace.getConfiguration('pandoc-citations');
        const citekey = this.csl.id;

        let formattedMap = new Map<string, string | vscode.MarkdownString>();
        // let completionItem = new vscode.CompletionItem(citekey, vscode.CompletionItemKind.Reference);
            
        let author = config.get('placeholders.noAuthor', '');
        if ('author' in this.csl && this.csl.author.length >= 1) {
            author = this.csl.author[0].family;
            if (this.csl.author.length >= 2) {
                author += " et al.";
            }
        }
        
        let year = config.get('placeholders.noDate', '');
        if ('issued' in this.csl) {
            if ('date-parts' in this.csl.issued) {
                year = this.csl.issued['date-parts'][0][0];
            } else if ('raw' in this.csl.issued) {
                year = moment(this.csl.issued.raw).format('YYYY');
            }
        }

        let title = '';
        if ('title' in this.csl) {
            title = this.csl.title;
        }

        let dictionary = new Map<string, string>();
        dictionary.set('citekey', citekey);
        dictionary.set('author', author);
        dictionary.set('year', year);
        dictionary.set('title', title);
        dictionary.set('bibname', this.bibName);
        
        // const insertTemplate = config.get('insertTemplate') as string;
        const insertTemplate = '${citekey}';
        formattedMap.set('insertText', expandString(insertTemplate, dictionary));
        
        const filterTemplate = config.get('filterTemplate', '${author} ${year} ${title}');
        formattedMap.set('filterText', expandString(filterTemplate, dictionary));
        
        const detailTemplate = '${bibname}';
        formattedMap.set('detailText', expandString(detailTemplate, dictionary));
        
        const documentationTemplate = '__${author}__ (${year}):  \n*${title}*';
        formattedMap.set('documentationText', new vscode.MarkdownString(expandString(documentationTemplate, dictionary)));

        const labelTemplate = '${author} (${year})';
        formattedMap.set('labelText', expandString(labelTemplate, dictionary));

        const titleTemplate = '${title}';
        formattedMap.set('titleText', expandString(titleTemplate, dictionary));

        return formattedMap;
    } 

    toCompletionItem(): vscode.CompletionItem {
        let completionItem = new vscode.CompletionItem(this.csl.id, vscode.CompletionItemKind.Reference);
        const formattedMap = this.asFormattedMap();
        
        completionItem.insertText = formattedMap.get('insertText') as string;
        completionItem.filterText = formattedMap.get('filterText') as string;
        completionItem.detail = formattedMap.get('detailText') as string;
        completionItem.documentation = formattedMap.get('documentationText') as vscode.MarkdownString;
        
        return completionItem;
    }

    toQuickPickItem(): vscode.QuickPickItem {
        const formattedMap = this.asFormattedMap();
        
        let quickPickItem = {
            description: formattedMap.get('insertText') as string, // `${citekey}`,
            label: formattedMap.get('labelText') as string, // `${author} (${year})`,
            detail: formattedMap.get('titleText') as string, //`${title}`
        };
        return quickPickItem;
    }
}

class BibTexLibrary {
    extension: Extension;
    readonly path: string;
    
    entries: Map<string, CitationItem>;

    protected hash: string | Int32Array;

    //protected entries: vscode.CompletionItem[];
    // protected hash: string | Int32Array;

    refresh() {
        try {
            const _data = fs.readFileSync(this.path);
            const data = _data.toString();
            const hash = Md5.hashStr(data);
            if (hash === this.hash) {
                return;
            }

            this.extension.logger.log(`Loading BibTeX entries from ${this.path}`);
            this.hash = hash;
            this.entries.clear();
            const bibfile = new Cite(data);
            for (const element of bibfile.data) {
                const bibitem = new Cite(element);
                if (bibitem && bibitem.data && bibitem.data.length <= 1) {
                    const entry = bibitem.data[0];
                    this.entries.set(entry.id, CitationItem.fromCslJsonObj(path.basename(this.path), entry));
                }
            }
        }
        catch (err) {
            this.extension.logger.log(`Error loading Bibtex from ${this.path}: ${err}`);
        }
    }

    getCompletionItems(): vscode.CompletionItem[] {
        const completionItems: vscode.CompletionItem[] = [];
        this.entries.forEach(entry => {
            completionItems.push(entry.toCompletionItem());
        });
        return completionItems;
    }

    getQuickPickItems(): vscode.QuickPickItem[] {
        const quickPickItems: vscode.QuickPickItem[] = [];
        this.entries.forEach(entry => {
            quickPickItems.push(entry.toQuickPickItem());
        });
        return quickPickItems;
    }

    constructor(extension: Extension, path: string) {
        this.extension = extension;
        this.path = path;
        this.entries = new Map<string, CitationItem>();
        this.hash = '';
    }
}

export class Citations {
    extension: Extension;
    libraries: Map<string, BibTexLibrary>;
    
    constructor(extension: Extension) {
        this.extension = extension;
        this.libraries = new Map<string, BibTexLibrary>();
    }

    refreshLibraries() {
        const configuration = vscode.workspace.getConfiguration('pandoc-citations');
        const bibfiles = configuration.get('bibfiles', []);

        bibfiles.forEach(bibfile => {
            if (!bibfile) {
                return;
            }
            if (!this.libraries.has(bibfile)) {
                this.libraries.set(bibfile, new BibTexLibrary(this.extension, bibfile));
            }
        });
        
        this.libraries.forEach(library => {
            library.refresh();
        });
    }

    provide(): vscode.CompletionItem[] {
        this.refreshLibraries();
        let completionItems: vscode.CompletionItem[] = [];
        this.libraries.forEach(library => {
            completionItems = [...completionItems, ...library.getCompletionItems()];
        });
        return completionItems;
    }

    browse(action: (selected: vscode.QuickPickItem) => void) {
        this.refreshLibraries();
        let quickPickItems: vscode.QuickPickItem[] = [];
        this.libraries.forEach(library => {
            quickPickItems = [...quickPickItems, ...library.getQuickPickItems()];
        });
        vscode.window.showQuickPick(quickPickItems, {
            placeHolder: 'Select bibliography item',
            matchOnDetail: true,
            matchOnDescription: true
        }).then(selected => {
            if (!selected) {
                return;
            }
            action(selected);
        });
    }

    browseAndInsertCitekey() {
        this.browse(selected => {
            if (vscode.window.activeTextEditor) {
                const editor = vscode.window.activeTextEditor;
                editor.edit(edit => edit.insert(editor.selection.start, `@${selected.description}`));
            }
        });
    }

    browseAndInsertBracketedCitation() {
        this.browse(selected => {
            if (vscode.window.activeTextEditor) {
                const editor = vscode.window.activeTextEditor;
                const snippet = new vscode.SnippetString(`[$1 @${selected.description}, $2] $0`);
                editor.insertSnippet(snippet, editor.selection.start);
            }
        });
    }
}

export class Completer implements vscode.CompletionItemProvider {
    extension: Extension;
    citations: Citations;
    

    constructor(extension: Extension) {
        this.extension = extension;
        this.citations = new Citations(extension);
    }

    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position,
            token: vscode.CancellationToken, context: vscode.CompletionContext)
            : Promise<vscode.CompletionList> {
        return new Promise((resolve, reject) => {
            try {
                if (!context.triggerCharacter) {
                    reject();
                }
                const completionItems = this.citations.provide();
                resolve(new vscode.CompletionList(completionItems));
            } 
            catch (err) {
                this.extension.logger.log(`Couldn't obtain completions: ${err}`);
                reject();
            }
        });
        
        
    }
}