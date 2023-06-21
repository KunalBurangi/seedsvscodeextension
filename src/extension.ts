/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { window, commands, ExtensionContext, ProgressLocation } from "vscode";
const homedir = require("os").homedir();
const fs = require("fs");
import * as cp from "child_process";
const pkg = require("../package.json");
let projectPath: any;
export function getwaitingMessage(count: number) {
  if (count === 1) {
    return "Please Wait this might take few minutes";
  }
  if (count === 2) {
    return "Installing packages...";
  }
  if (count === 3) {
    return "Setting up project";
  }
}
export async function executeCommand(command: string) {
  return new Promise(async (resolve, reject) => {
    let stdout = "";
    let stderr = "";
    const child: any = await cp.exec(command, {
      cwd: `${homedir}\\.vscode\\extensions\\kunalburangi.kbur-seed-test-1-${pkg.version}\\dist`,
    });

    const progress: any = window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: "Loading...",
        cancellable: false,
      },
      (progress, token) => {
        token.onCancellationRequested(() => {
          child.kill();
          reject(new Error(`Command  was cancelled`));
        });

        return new Promise(async (resolve, reject) => {
          child.stdout.on("data", (data: any) => {
            stdout += data;
            progress.report({ message: data.toString() });
          });

          child.stderr.on("data", (data: any) => {
            stderr += data;
            progress.report({ message: data.toString() });
          });

          child.on("close", (exitCode: any) => {
            progress.report({ increment: 100 });
            resolve({ stdout, stderr, exitCode });
          });

          child.on("error", (err: any) => {
            reject(err);
          });
        });
      }
    );
    progress
      .then(() => {
        window.showInformationMessage(`Command has finished running`);
        resolve(stdout);
      })
      .catch((err: any) => {
        window.showErrorMessage(err.message);
        reject(err);
      });
  });
}

export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand("seed.templates", async () => {
      let terminal = window.activeTerminal;
      let getSelectedRepovalue = "";
      // Get project name from user
      const projectName = await window.showInputBox({
        value: "",
        valueSelection: [2, 4],
        placeHolder: "Name of project",
        ignoreFocusOut: true,
        validateInput: (text) => {
          // window.showInformationMessage(`Validating: ${text}`);
          return text === "123" ? "Not 123!" : null;
        },
      });

      if (projectName) {
        // Get Project Path from user
        projectPath = await window.showInputBox({
          value: "",
          valueSelection: [2, 4],
          ignoreFocusOut: true,
          placeHolder:
            "Path of the directory where the project should get created. eg: C://temp",
          validateInput: (text) => {
            // window.showInformationMessage(`Validating: ${text}`);
            return text === "123" ? "Not 123!" : null;
          },
        });
        if (projectPath) {
          projectPath = `${projectPath}/${projectName}`;

          if (!fs.existsSync(projectPath)) {
            executeCommand(`mkdir ${projectPath}`);
          }

          let getRepoValue;
          let repoList: any = await executeCommand(`tmpo repository list `);
          repoList = repoList.split("\n");

          await window.showQuickPick(repoList, {
            placeHolder: "Select Repository",
            ignoreFocusOut: true,
            onDidSelectItem: (item) =>
              (getRepoValue = item.toString().toLowerCase()),
          });
          const outputRepovalueList: any = await executeCommand(
            `tmpo template list -r "${getRepoValue}"`
          );
          let selectedrepositorylist = outputRepovalueList.split("\n");
          if (selectedrepositorylist[0].includes("New release found")) {
            selectedrepositorylist = selectedrepositorylist.reverse();
            selectedrepositorylist.pop();
          }

          await window.showQuickPick(selectedrepositorylist, {
            placeHolder: `Select "${getRepoValue}" Repository`,
            ignoreFocusOut: true,
            onDidSelectItem: (item) =>
              (getSelectedRepovalue = item.toString().toLowerCase()),
          });
          if (
            projectName &&
            projectPath &&
            getRepoValue &&
            getSelectedRepovalue
          ) {
            await executeCommand(
              `echo y | tmpo --yes init "${projectName}" -r "${getRepoValue}" -t "${getSelectedRepovalue}" -d "${projectPath}" --username . --email . --remote . `
            );

            terminal?.hide();
          }
        }
      }
    })
  );
  context.subscriptions.push(
    commands.registerCommand("seed.addrepository", async () => {
      let selectedRepositoryType: any = "";
      let selectedRepoSource: any = "";
      let authType: any = "";
      let repositoryUrl: any = "";
      let branchName: any = "";
      let accessToken: any = "";
      let repoNamealias: any = "";
      let repositoryDescription: any = "";

      selectedRepositoryType = "";
      selectedRepoSource = "";
      authType = "";
      repositoryUrl = "";
      branchName = "";
      accessToken = "";
      repoNamealias = "";
      repositoryDescription = "";
      await window
        .showQuickPick(["Remote", "Directory"], {
          placeHolder: "Select Repository Type",
          ignoreFocusOut: true,
        })
        .then((selection) => {
          if (!selection) {
            return;
          }
          selectedRepositoryType = selection.toString().toLowerCase();
        });
      if (!selectedRepositoryType) {
        window.showErrorMessage("Repository Type is required!");
        return;
      }
      if (selectedRepositoryType && selectedRepositoryType === "remote") {
        await window
          .showQuickPick(["Github", "Gitlab"], {
            placeHolder: "Select Repository Source",
            ignoreFocusOut: true,
          })
          .then((selection) => {
            if (!selection) {
              return;
            }
            selectedRepoSource = selection.toString().toLowerCase();
          });
        if (selectedRepoSource) {
          await window
            .showQuickPick(["Basic", "None", "Token"], {
              placeHolder: "Select Authentication Mode",
              ignoreFocusOut: true,
            })
            .then((selection) => {
              if (!selection) {
                return;
              }
              authType = selection.toString().toLocaleLowerCase();
            });
          if (!authType) {
            window.showErrorMessage("Authentication Type is required!");
            return;
          }
          if (authType === "basic") {
            window.showErrorMessage("Basic  auth type is not yet supported!");
            selectedRepositoryType = "";
            selectedRepoSource = "";
            authType = "";
            repositoryUrl = "";
            branchName = "";
            accessToken = "";
            repoNamealias = "";
            repositoryDescription = "";
            return;
          } else {
            repositoryUrl = await window.showInputBox({
              placeHolder: "Enter repository url ",
              ignoreFocusOut: true,
              validateInput: (text) => {
                // window.showInformationMessage(`Validating: ${text}`);
                return text === "123" ? "Not 123!" : null;
              },
            });
            if (repositoryUrl) {
              branchName = await window.showInputBox({
                value: "",
                valueSelection: [2, 4],
                placeHolder: "Enter branch name ",
                ignoreFocusOut: true,
                validateInput: (text) => {
                  // window.showInformationMessage(`Validating: ${text}`);
                  return text === "123" ? "Not 123!" : null;
                },
              });
              if (branchName) {
                accessToken = await window.showInputBox({
                  value: "",
                  valueSelection: [2, 4],
                  placeHolder: "Enter access token ",
                  ignoreFocusOut: true,
                  validateInput: (text) => {
                    // window.showInformationMessage(`Validating: ${text}`);
                    return text === "123" ? "Not 123!" : null;
                  },
                });
                if (accessToken || authType === "none") {
                  repoNamealias = await window.showInputBox({
                    value: "",
                    valueSelection: [2, 4],
                    placeHolder: "Enter repository name ",
                    ignoreFocusOut: true,
                    validateInput: (text) => {
                      // window.showInformationMessage(`Validating: ${text}`);
                      return text === "123" ? "Not 123!" : null;
                    },
                  });
                  if (repoNamealias) {
                    repositoryDescription = await window.showInputBox({
                      value: "",
                      valueSelection: [2, 4],
                      placeHolder: "Enter description ",
                      ignoreFocusOut: true,
                      validateInput: (text) => {
                        // window.showInformationMessage(`Validating: ${text}`);
                        return text === "123" ? "Not 123!" : null;
                      },
                    });
                  }
                  if (
                    selectedRepositoryType &&
                    selectedRepoSource &&
                    authType &&
                    repositoryUrl &&
                    branchName &&
                    repoNamealias &&
                    repositoryDescription
                  ) {
                    let finalCommand = `tmpo repository add -t "${selectedRepositoryType}" -n  "${repoNamealias}" -d "${repositoryDescription}" --provider "${selectedRepoSource}" --authentication "${authType}" --url "${repositoryUrl}" --branch "${branchName}"`;
                    finalCommand =
                      authType === "token"
                        ? finalCommand + ` --token ${accessToken}`
                        : finalCommand;
                    await executeCommand(finalCommand);
                  }
                } else {
                  window.showErrorMessage(
                    "Access token is required if auth type is token"
                  );
                  return;
                }
              }
            } else {
              window.showErrorMessage("Invalid repository url");
              return;
            }
          }
        } else {
          window.showErrorMessage("Repository provider is required!");
          return;
        }
      } else {
        window.showErrorMessage(
          "Repository Type Directory is not yet supported!"
        );
        return;
      }
    })
  );
}
