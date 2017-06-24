'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    //imports
    let sh = require("shelljs");
    let fs = require('fs');
    //globals
    let c_file = new RegExp('.*\.c$');
    let err_file = "errors.txt";
    //decorations
    let err_dec = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(200,30,30,0.4)'
    });
    let warn_dec = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(30,200,30,0.4)'
    });
    let sec_dec = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(30,30,200,0.4)'
    });
    //functions decl
    //function 
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.compileInfo', () => {
        let editor = vscode.window.activeTextEditor;
        //escape filename in case it contains space
        let fn = editor.document.fileName.replace(/\s/g, '\\ ');
        err_dec.dispose();
        warn_dec.dispose();
        sec_dec.dispose();
        // definitions for all decorations
        err_dec = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(200,30,30,0.4)'
        });
        warn_dec = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(30,200,30,0.4)'
        });
        sec_dec = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(30,30,200,0.4)'
        });
        //test whether we are dealing with C file
        let isCFile = c_file.test(fn);
        if (isCFile) {
            // object for the C file currently edited
            let this_file = editor.document;
            let tLines = this_file.lineCount; // total no.of lines in the currently opened file
            // shell execute base command for gcc "no extra parameters given"
            sh.exec("gcc -Wall " + fn + " > " + err_file + " 2>&1");
            let lineReader = require('readline').createInterface({
                input: require('fs').createReadStream(err_file)
            });
            let err_arr = [];
            let warn_arr = [];
            let sec_arr = [];
            lineReader.on('line', function (line) {
                // look out for the following pattern 
                // line_split 1 has filename
                //            2 has line no
                //            3 has column no
                //            4 has reason
                //            5 has extra info
                let line_split = line.match('^([^:]*):([^:]*):([^:]*):([^:]*):([^:]*)');
                if (line_split != null && line_split.length == 6) {
                    let this_line = parseInt(line_split[2]) - 1;
                    if (this_line <= tLines) {
                        let linex = this_file.lineAt(parseInt(line_split[2]) - 1);
                        let non_white = linex.firstNonWhitespaceCharacterIndex;
                        let end_pos = linex.text.length;
                        let pos1 = new vscode.Range(this_line, non_white, this_line, end_pos);
                        let msg = line_split[4].trim();
                        let dep = line_split[5].indexOf('deprecated');
                        if (msg == "error") {
                            //warn decorations at the same line should be removed
                            let arr_len1 = warn_arr.length;
                            for (let i = 0; i < arr_len1; i++) {
                                if (warn_arr[i].contains(pos1)) {
                                    //think on dispose
                                    warn_arr.splice(i, 1);
                                    arr_len1 -= 1;
                                    editor.setDecorations(warn_dec, warn_arr);
                                }
                            }
                            //also do the same for security warnings
                            let arr_len2 = sec_arr.length;
                            for (let i = 0; i < arr_len2; i++) {
                                if (sec_arr[i].contains(pos1)) {
                                    //think on dispose
                                    sec_arr.splice(i, 1);
                                    arr_len2 -= 1;
                                    editor.setDecorations(sec_dec, sec_arr);
                                }
                            }
                            // also dont repeat same decor... over and over again
                            let arr_len3 = err_arr.length;
                            if (arr_len3 > 0) {
                                for (let i = 0; i < arr_len3; i++) {
                                    if (err_arr[i].contains(pos1)) {
                                        break;
                                    }
                                    else if (i == arr_len3 - 1) {
                                        err_arr.push(pos1);
                                        editor.setDecorations(err_dec, err_arr);
                                    }
                                }
                            }
                            else {
                                err_arr.push(pos1);
                                editor.setDecorations(err_dec, err_arr);
                            }
                        }
                        else if (msg == "warning" && dep <= -1) {
                            let arr_len = sec_arr.length;
                            if (arr_len > 0) {
                                for (let i = 0; i < arr_len; i++) {
                                    if (sec_arr[i].contains(pos1)) {
                                        break;
                                    }
                                    else if (i == arr_len - 1) {
                                        // also dont repeat same decor... over and over again
                                        let arr_len3 = warn_arr.length;
                                        if (arr_len3 > 0) {
                                            for (let i = 0; i < arr_len3; i++) {
                                                if (warn_arr[i].contains(pos1)) {
                                                    break;
                                                }
                                                if (i == arr_len3 - 1) {
                                                    warn_arr.push(pos1);
                                                    editor.setDecorations(warn_dec, warn_arr);
                                                }
                                            }
                                        }
                                        else {
                                            warn_arr.push(pos1);
                                            editor.setDecorations(warn_dec, warn_arr);
                                        }
                                    }
                                }
                            }
                            else {
                                // also dont repeat same decor... over and over again
                                let arr_len3 = warn_arr.length;
                                if (arr_len3 > 0) {
                                    for (let i = 0; i < arr_len3; i++) {
                                        if (warn_arr[i].contains(pos1)) {
                                            break;
                                        }
                                        if (i == arr_len3 - 1) {
                                            warn_arr.push(pos1);
                                            editor.setDecorations(warn_dec, warn_arr);
                                        }
                                    }
                                }
                                else {
                                    warn_arr.push(pos1);
                                    editor.setDecorations(warn_dec, warn_arr);
                                }
                            }
                        }
                        else if (dep > -1) {
                            let arr_len = warn_arr.length;
                            for (let i = 0; i < arr_len; i++) {
                                if (warn_arr[i].contains(pos1)) {
                                    //think on dispose
                                    warn_arr.splice(i, 1);
                                    arr_len -= 1;
                                    editor.setDecorations(warn_dec, warn_arr);
                                }
                            }
                            sec_arr.push(pos1);
                            editor.setDecorations(sec_dec, sec_arr);
                        }
                    }
                }
            });
        }
        else {
            vscode.window.showInformationMessage("Not a C file.");
        }
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map