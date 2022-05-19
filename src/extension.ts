/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from "vscode";
import { exec } from "child_process";
let myStatusBarItem: vscode.StatusBarItem;

export function activate({ subscriptions }: vscode.ExtensionContext) {
  // register a command that is invoked when the status bar
  // item is selected
  const myCommandId = "nvm-windows.nvmList";
  subscriptions.push(
    vscode.commands.registerCommand(myCommandId, async () => {
      const nodeVersionList = await getNodeVersionList();
      if (nodeVersionList && nodeVersionList.length) {
        vscode.window.showQuickPick(nodeVersionList);
      }
    })
  );

  // create a new status bar item that we can now manage
  myStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    10000
  );

  myStatusBarItem.command = myCommandId;
  subscriptions.push(myStatusBarItem);
  getCurrentNodeVersion().then((v) => {
    console.log(v);

    myStatusBarItem.tooltip = `now nodeVersion is ${v}`;
    myStatusBarItem.text = `v${v}`;
    myStatusBarItem.show();
  });
  // register some listener that make sure the status bar
  // item always up-to-date
  // subscriptions.push(
  //   vscode.window.onDidChangeTextEditorSelection(updateStatusBarItem)
  // );

  // // update status bar item once at start
  // updateStatusBarItem();
}
async function getNodeVersionList() {
  return new Promise<string[]>((resolve, reject) =>
    exec("nvm list", (err, stdout, stderr) => {
      if (err) {
      }

      if (stdout) {
        // resolve(stdout.match(/\d+(?:\.\d+){2}/g) as string[]);
        resolve(
          stdout
            .trim()
            .split("\n")
            .map((v) => v.trim()) as string[]
        );
      }
    })
  );
}

async function getCurrentNodeVersion() {
  return new Promise<string | undefined>((resolve, reject) =>
    exec("nvm list", (err, stdout, stderr) => {
      if (err) {
      }

      if (stdout) {
        // resolve(stdout.match(/\d+(?:\.\d+){2}/g) as string[]);
        const current = stdout
          .trim()
          .split("\n")
          .map((v) => v.trim())
          .find((v) => v.startsWith("*"));
        if (current) {
          resolve(current.match(/\d+(?:\.\d+){2}/g)?.[0]);
        }
      }
    })
  );
}
