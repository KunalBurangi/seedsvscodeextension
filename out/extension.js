"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = exports.executeCommand = exports.getwaitingMessage = void 0;
const vscode_1 = require("vscode");
const fs = require("fs");
const cp = require("child_process");
const pkg = require("../package.json");
let projectPath;
function getwaitingMessage(count) {
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
exports.getwaitingMessage = getwaitingMessage;
function executeCommand(command, cwd) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            let stdout = "";
            let stderr = "";
            const child = yield cp.exec(command, { cwd });
            const progress = vscode_1.window.withProgress({
                location: vscode_1.ProgressLocation.Notification,
                title: "Loading...",
                cancellable: false,
            }, (progress, token) => {
                token.onCancellationRequested(() => {
                    child.kill();
                    reject(new Error(`Command  was cancelled`));
                });
                return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    child.stdout.on("data", (data) => {
                        stdout += data;
                        progress.report({ message: data.toString() });
                    });
                    child.stderr.on("data", (data) => {
                        stderr += data;
                    });
                    child.on("close", (exitCode) => {
                        progress.report({ increment: 100 });
                        resolve({ stdout, stderr, exitCode });
                    });
                    child.on("error", (err) => {
                        reject(err);
                    });
                }));
            });
            progress
                .then(() => {
                vscode_1.window.showInformationMessage(`Command has finished running`);
                resolve(stdout);
            })
                .catch((err) => {
                vscode_1.window.showErrorMessage(err.message);
                reject(err);
            });
        }));
    });
}
exports.executeCommand = executeCommand;
function activate(context) {
    context.subscriptions.push(vscode_1.commands.registerCommand("seed.templates", () => __awaiter(this, void 0, void 0, function* () {
        let terminal = vscode_1.window.activeTerminal;
        let getSelectedRepovalue = "";
        // Get project name from user
        const projectName = yield vscode_1.window.showInputBox({
            value: "",
            valueSelection: [2, 4],
            placeHolder: "Name of project",
            validateInput: (text) => {
                // window.showInformationMessage(`Validating: ${text}`);
                return text === "123" ? "Not 123!" : null;
            },
        });
        if (projectName) {
            // Get Project Path from user
            projectPath = yield vscode_1.window.showInputBox({
                value: "",
                valueSelection: [2, 4],
                placeHolder: "Path of the directory where the project should get created. eg: C://temp",
                validateInput: (text) => {
                    // window.showInformationMessage(`Validating: ${text}`);
                    return text === "123" ? "Not 123!" : null;
                },
            });
            if (projectPath) {
                const init = (cmd) => __awaiter(this, void 0, void 0, function* () {
                    return new Promise((resolve) => {
                        terminal = vscode_1.window.createTerminal({
                            name: `Seed Project`,
                            hideFromUser: false,
                            cwd: projectPath,
                        });
                        terminal.show(true);
                        terminal === null || terminal === void 0 ? void 0 : terminal.sendText(cmd);
                        setTimeout(() => {
                            resolve("true");
                        }, 5000);
                    });
                });
                let execRes = "";
                const execShell = (cmd) => __awaiter(this, void 0, void 0, function* () {
                    return vscode_1.window.withProgress({
                        location: vscode_1.ProgressLocation.Notification,
                        title: `Setting up ${getSelectedRepovalue} project`,
                        cancellable: false,
                    }, (progress, token) => {
                        token.onCancellationRequested(() => {
                            console.log("User canceled the long running operation");
                        });
                        progress.report({ increment: 0 });
                        let waitingMessageCount = 0;
                        setInterval(() => {
                            progress.report({
                                increment: 2,
                                message: getwaitingMessage(waitingMessageCount > 3
                                    ? waitingMessageCount - waitingMessageCount
                                    : waitingMessageCount + 1),
                            });
                            waitingMessageCount =
                                waitingMessageCount > 3
                                    ? waitingMessageCount - waitingMessageCount
                                    : waitingMessageCount + 1;
                        }, 2000);
                        const p = new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                            yield cp.exec(`${cmd}`, { cwd: projectPath, env: process.env }, (e, stdout) => {
                                if (e) {
                                    reject(vscode_1.window.showErrorMessage(e.message));
                                }
                                else {
                                    progress.report({
                                        increment: 10,
                                        message: "Done.",
                                    });
                                    execRes = stdout;
                                    resolve(stdout);
                                }
                            });
                        }));
                        return p;
                    });
                });
                if (!fs.existsSync(projectPath)) {
                    executeCommand(`mkdir ${projectPath}`, projectPath);
                }
                yield init(`cp $HOME\\.vscode\\extensions\\kunalburangi.kbur-seed-test-1-${pkg.version}\\dist\\tmpo.exe ${projectPath}`)
                    .then(() => __awaiter(this, void 0, void 0, function* () {
                    let getRepoValue;
                    let repoList = yield executeCommand(`tmpo repository list `, projectPath);
                    repoList = repoList.split("\n");
                    yield vscode_1.window.showQuickPick(repoList, {
                        placeHolder: "Select Repository",
                        onDidSelectItem: (item) => (getRepoValue = item.toString().toLowerCase()),
                    });
                    const outputRepovalueList = yield executeCommand(`tmpo template list -r ${getRepoValue}`, projectPath);
                    let selectedrepositorylist = outputRepovalueList.split("\n");
                    if (selectedrepositorylist[0].includes("New release found")) {
                        selectedrepositorylist = selectedrepositorylist.reverse();
                        selectedrepositorylist.pop();
                    }
                    yield vscode_1.window.showQuickPick(selectedrepositorylist, {
                        placeHolder: `Select ${getRepoValue} Repository`,
                        onDidSelectItem: (item) => (getSelectedRepovalue = item.toString().toLowerCase()),
                    });
                    if (projectName &&
                        projectPath &&
                        getRepoValue &&
                        getSelectedRepovalue) {
                        yield executeCommand(`echo y | tmpo --yes init ${projectName} -r ${getRepoValue} -t ${getSelectedRepovalue} --username . --email . --remote . `, projectPath);
                        yield init(`rm ${projectPath}\\tmpo.exe`).catch((err) => {
                            console.log(err.message);
                        });
                        terminal === null || terminal === void 0 ? void 0 : terminal.hide();
                    }
                }))
                    .catch((err) => {
                    console.log(err.message);
                });
            }
        }
    })));
    context.subscriptions.push(vscode_1.commands.registerCommand("seed.addrepository", () => __awaiter(this, void 0, void 0, function* () {
        let selectedRepositoryType = "";
        let selectedRepoSource = "";
        let authType = "";
        let repositoryUrl;
        let branchName;
        let accessToken;
        let repoNamealias;
        let repositoryDescription;
        projectPath = yield vscode_1.window.showInputBox({
            value: "",
            valueSelection: [2, 4],
            placeHolder: "Path of the directory where the project should get created. eg: C://temp",
            validateInput: (text) => {
                // window.showInformationMessage(`Validating: ${text}`);
                return text === "123" ? "Not 123!" : null;
            },
        });
        if (projectPath) {
            yield vscode_1.window.showQuickPick(["Remote,Directory"], {
                placeHolder: "Select Repository Type",
                onDidSelectItem: (item) => (selectedRepositoryType = item.toString().toLowerCase()),
            });
            if (selectedRepoSource === "Remote") {
                yield vscode_1.window.showQuickPick(["Github,Gitlab"], {
                    placeHolder: "Select Repository Source",
                    onDidSelectItem: (item) => (selectedRepoSource = item.toString().toLowerCase()),
                });
                yield vscode_1.window.showQuickPick(["Basic", "None", "Token"], {
                    placeHolder: "Select Authentication Mode",
                    onDidSelectItem: (item) => (authType = item.toString().toLocaleLowerCase()),
                });
                if (authType !== "Token") {
                    vscode_1.window.showErrorMessage("Basic and none auth type is not yet supported!");
                }
                else {
                    repositoryUrl = yield vscode_1.window.showInputBox({
                        value: "",
                        valueSelection: [2, 4],
                        placeHolder: "Enter repository url ",
                        validateInput: (text) => {
                            // window.showInformationMessage(`Validating: ${text}`);
                            return text === "123" ? "Not 123!" : null;
                        },
                    });
                    if (repositoryUrl) {
                        branchName = yield vscode_1.window.showInputBox({
                            value: "",
                            valueSelection: [2, 4],
                            placeHolder: "Enter branch name ",
                            validateInput: (text) => {
                                // window.showInformationMessage(`Validating: ${text}`);
                                return text === "123" ? "Not 123!" : null;
                            },
                        });
                        if (branchName) {
                            accessToken = yield vscode_1.window.showInputBox({
                                value: "",
                                valueSelection: [2, 4],
                                placeHolder: "Enter access token ",
                                validateInput: (text) => {
                                    // window.showInformationMessage(`Validating: ${text}`);
                                    return text === "123" ? "Not 123!" : null;
                                },
                            });
                            if (accessToken) {
                                repoNamealias = yield vscode_1.window.showInputBox({
                                    value: "",
                                    valueSelection: [2, 4],
                                    placeHolder: "Enter repository name ",
                                    validateInput: (text) => {
                                        // window.showInformationMessage(`Validating: ${text}`);
                                        return text === "123" ? "Not 123!" : null;
                                    },
                                });
                                if (repoNamealias) {
                                    repositoryDescription = yield vscode_1.window.showInputBox({
                                        value: "",
                                        valueSelection: [2, 4],
                                        placeHolder: "Enter description ",
                                        validateInput: (text) => {
                                            // window.showInformationMessage(`Validating: ${text}`);
                                            return text === "123" ? "Not 123!" : null;
                                        },
                                    });
                                }
                                if (selectedRepositoryType &&
                                    selectedRepoSource &&
                                    authType &&
                                    repositoryUrl &&
                                    branchName &&
                                    accessToken &&
                                    repoNamealias &&
                                    repositoryDescription) {
                                    yield executeCommand(`tmpo repository add -t ${selectedRepositoryType} -n ${repoNamealias} -d ${repositoryDescription} --provider ${selectedRepoSource} --authentication ${authType} --url ${repositoryUrl} --branch ${branchName}`, projectPath);
                                }
                            }
                        }
                    }
                    else {
                        vscode_1.window.showErrorMessage("Invalid repository url");
                    }
                }
            }
            else {
                vscode_1.window.showErrorMessage("Repository Type Directory is not yet supported!");
            }
        }
    })));
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map