'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    //imports
    let sh = require("shelljs")
    let fs = require('fs')

    //globals
    let c_file = new RegExp('.*\.c$');
    let err_file = "errors.txt"


    //decorations
    let err_dec = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(200,30,30,0.4)'
        })
    let warn_dec = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(30,200,30,0.4)'
        })
    let sec_dec = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(30,30,200,0.4)'
        })

    //functions decl
    //function 

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.compileInfo', () => {

        let editor = vscode.window.activeTextEditor;
        let fn = editor.document.fileName.replace(/\s/g,'\\ ');
        err_dec.dispose()
        warn_dec.dispose()
        sec_dec.dispose()
        err_dec = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(200,30,30,0.4)'
        })
        warn_dec = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(30,200,30,0.4)'
        })
        sec_dec = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(30,30,200,0.4)'
        })


        let isCFile = c_file.test(fn);
        if(isCFile){
            // object for the C file currently edited
            let this_file = editor.document
            let tLines = this_file.lineCount  // total no.of lines
            sh.exec("gcc "+fn+" > "+err_file+" 2>&1");
            
            let lineReader = require('readline').createInterface({
                input: require('fs').createReadStream(err_file)
            })

            let err_arr = [];
            let warn_arr = [];
            let sec_arr = [];

            lineReader.on('line', function(line){
                let line_split = line.match('^([^:]*):([^:]*):([^:]*):([^:]*):([^:]*)')
                if(line_split!=null && line_split.length==6){
                    let this_line = parseInt(line_split[2])-1;
                    if (this_line<=tLines){
                        let linex = this_file.lineAt(parseInt(line_split[2])-1)
                        let non_white = linex.firstNonWhitespaceCharacterIndex;
                        let end_pos = linex.text.length;
                        let pos1 = new vscode.Range(this_line,non_white,this_line,end_pos)
                        let msg = line_split[4].trim();
                        let dep = line_split[5].indexOf('deprecated')
                        if(msg=="error"){
                            let arr_len = warn_arr.length;
                            for(let i=0;i<arr_len;i++){
                                if(warn_arr[i].contains(pos1)){
                                    //think on dispose
                                    warn_arr.splice(i,1);
                                    arr_len-=1;
                                    editor.setDecorations(warn_dec, warn_arr);
                                }
                            }
                            err_arr.push(pos1)
                            editor.setDecorations(err_dec, err_arr)
                        }
                        else if(msg=="warning" && dep<=-1){
                            let arr_len = sec_arr.length;
                            warn_arr.push(pos1)
                            for(let i=0;i<arr_len;i++){
                                if(sec_arr[i].contains(pos1)){
                                    warn_arr.pop()
                                    break;
                                }
                            }
                            editor.setDecorations(warn_dec, warn_arr)
                        }
                        else if(dep>-1){
                            let arr_len = warn_arr.length;
                            for(let i=0;i<arr_len;i++){
                                if(warn_arr[i].contains(pos1)){
                                    //think on dispose
                                    warn_arr.splice(i,1);
                                    arr_len-=1;
                                    editor.setDecorations(warn_dec, warn_arr);
                                }
                            }
                            sec_arr.push(pos1)
                            editor.setDecorations(sec_dec, sec_arr)
                        }
                    }
                }
            })
        }
        else{
            vscode.window.showInformationMessage("Not a C file.");
        }

    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}