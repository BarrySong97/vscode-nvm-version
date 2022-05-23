/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from "vscode";
import { exec } from "child_process";
import { promises as fs } from "fs";
let myStatusBarItem: vscode.StatusBarItem;
let myQuickInput: vscode.QuickPick<vscode.QuickPickItem>;
export function activate({ subscriptions }: vscode.ExtensionContext) {
  // register a command that is invoked when the status bar
  // item is selected
  const myCommandId = "nvm-windows.nvmList";
  subscriptions.push(
    vscode.commands.registerCommand(myCommandId, async () => {
      const nodeVersionList = await getNodeVersionList();
      const currentNodeVersion = await getCurrentNodeVersion();
      const projectNodeVersion = await getNvmrcVersion();
      if (
        currentNodeVersion &&
        projectNodeVersion &&
        nodeVersionList &&
        nodeVersionList.length
      ) {
        myQuickInput = vscode.window.createQuickPick();
        const items = nodeVersionList.map((v) => {
          if (
            currentNodeVersion === projectNodeVersion &&
            v === projectNodeVersion
          ) {
            return {
              label: v,
              description: "matched",
            };
          }
          if (v === projectNodeVersion) {
            return {
              label: v,
              description: "expect project node version",
            };
          }
          if (v === currentNodeVersion) {
            return {
              label: v,
              description: "current node version",
            };
          }
          return {
            label: v,
          };
        });
        myQuickInput.items = items;
        myQuickInput.show();
        myQuickInput.onDidChangeSelection((v) => {
          checkNodeVersion(v[0].label);
        });
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
    myStatusBarItem.tooltip = `now nodeVersion is ${v}`;
    myStatusBarItem.text = `v${v}`;
    myStatusBarItem.show();
  });
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
            .map((v) => v.trim())
            .map((v) => v.match(/\d+(?:\.\d+){2}/g)?.[0]) as string[]
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

async function getNvmrcVersion() {
  const folders = vscode.workspace.workspaceFolders;
  if (folders && folders.length === 1) {
    try {
      const result = await fs.readFile(
        folders[0].uri.fsPath + "/.nvmrc",
        "utf8"
      );
      return result;
    } catch {
      throw Error("dont have .nvmrc file in your rootpath");
    }
  }
}

async function checkNodeVersion(version: string) {
  return new Promise<string | undefined>((resolve, reject) =>
    exec(`nvm use ${version}`, (err, stdout, stderr) => {
      if (err) {
        vscode.window.showErrorMessage(err.message);
      }

      if (stdout) {
        vscode.window.showInformationMessage(stdout);
        myQuickInput.hide();
      }
    })
  );
}
