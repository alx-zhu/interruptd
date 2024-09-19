// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import CodeGraph from "./graph";
import { GraphTreeDataProvider } from "./treeViewProvider";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders) {
    vscode.window.showErrorMessage("No workspace folder open");
    return;
  }

  const rootPath = folders[0].uri.fsPath;

  const graph = new CodeGraph(rootPath);
  await graph.initialize();

  const treeDataProvider = new GraphTreeDataProvider(graph);
  vscode.window.registerTreeDataProvider(
    "interruptdGraphView",
    treeDataProvider
  );
  console.log("Tree data provider registered");

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const displayGraphCommand = vscode.commands.registerCommand(
    "interruptd.launchInterruptd",
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage("Generating Graph.");
      graph.displayGraph();
      treeDataProvider.refresh();
    }
  );

  // Update the graph when a document is changed
  const onTextChangeListener = vscode.workspace.onDidChangeTextDocument(
    (event) => {
      // Here you can access the changed document and perform actions
      console.log(`Document changed: ${event.document.uri}`);
      graph.modifyFile(event.document.uri.fsPath);
    }
  );

  // Refresh the graph when a document is saved
  const onSaveListener = vscode.workspace.onDidSaveTextDocument((event) => {
    console.log(`Document saved: ${event.uri}`);
    treeDataProvider.refresh();
  });

  const onOpenListener = vscode.workspace.onDidOpenTextDocument((event) => {
    console.log(`Document opened: ${event.uri}`);
    graph.navToFile(event.uri.fsPath);
    treeDataProvider.refresh();
  });

  context.subscriptions.push(
    displayGraphCommand,
    onTextChangeListener,
    onSaveListener,
    onOpenListener
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}

// Useful functions:
// openTextDocument(uri: Uri): Thenable<TextDocument>
// save(uri: Uri): Thenable<Uri | undefined>
// onDidChangeTextDocument
// type: event: TextDocumentChangeEvent
