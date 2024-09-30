// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import CodeGraph from "./graph";
import { DoiListProvider } from "./doiListProvider";
import { DoiNeighborProvider } from "./doiNeighborProvider";
import { DoiExplorer } from "./doiExplorerProvider";

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

  const doiList = new DoiListProvider(graph, rootPath);
  vscode.window.registerTreeDataProvider("interruptdDoiList", doiList);
  console.log("Tree data provider registered");

  const doiExplorer = new DoiExplorer(graph, rootPath);
  vscode.window.registerTreeDataProvider("doiExplorer", doiExplorer);
  console.log("Weighted file explorer registered");

  const neighborList = new DoiNeighborProvider(graph, rootPath);
  vscode.window.registerTreeDataProvider("neighborDoiList", neighborList);

  const commands = registerCommands(graph, doiList, doiExplorer, neighborList);

  // Update the graph when a document is changed
  const onFileChangeListener = vscode.workspace.onDidChangeTextDocument(
    (event) => {
      // Here you can access the changed document and perform actions
      if (event.document.uri.scheme === "file") {
        console.log(`Document changed: ${event.document.uri}`);
        graph.modifyFile(event.document.uri.fsPath);
      }
    }
  );

  // Refresh the graph when a document is saved
  const onFileSaveListener = vscode.workspace.onDidSaveTextDocument((event) => {
    console.log(`Document saved: ${event.uri}`);
    if (event.uri.scheme === "file") {
      graph.saveFile(event.uri.fsPath);
      doiList.refresh();
      doiExplorer.refresh();
      neighborList.refresh();
    }
  });

  // const onOpenListener = vscode.workspace.onDidOpenTextDocument((event) => {
  //   if (event.uri.scheme === "file") {
  //     console.log(`Document opened: ${event.uri.fsPath}`);
  //     graph.navToFile(event.uri.fsPath);
  //     doiList.refresh();
  //   }
  // });

  // Add this near your other event listeners
  const onFileSelectListener = vscode.window.onDidChangeActiveTextEditor(
    (editor) => {
      if (editor && editor.document.uri.scheme === "file") {
        console.log(`File selected: ${editor.document.uri.fsPath}`);
        graph.navToFile(editor.document.uri.fsPath);
        doiList.refresh();
        doiExplorer.refresh();
        neighborList.setCurrentPath(editor.document.uri.fsPath);
      }
    }
  );

  // Add this new listener for file creation
  const onFileCreateListener = vscode.workspace.onDidCreateFiles((event) => {
    for (const file of event.files) {
      if (file.scheme === "file") {
        console.log(`New file created: ${file.fsPath}`);
        graph.addFile(file.fsPath);
        doiList.refresh();
        doiExplorer.refresh();
        neighborList.refresh();
      }
    }
  });

  // Need to detect when a file is deleted
  // Need to detect when a file is moved/renamed

  context.subscriptions.push(
    ...commands,
    onFileChangeListener,
    onFileSaveListener,
    onFileSelectListener,
    onFileCreateListener
  );
}

function registerCommands(
  graph: CodeGraph,
  doiList: DoiListProvider,
  doiExplorer: DoiExplorer,
  neighborList: DoiNeighborProvider
) {
  const generateGraphCommand = vscode.commands.registerCommand(
    "interruptd.generateGraph",
    () => {
      vscode.window.showInformationMessage("Generating Graph.");
      graph.initialize();
      doiList.refresh();
      doiExplorer.refresh();
      neighborList.refresh();
    }
  );

  const refreshCommand = vscode.commands.registerCommand(
    "interruptd.refresh",
    () => {
      doiList.refresh();
      doiExplorer.refresh();
      neighborList.refresh();
    }
  );

  const filterNoneCommand = vscode.commands.registerCommand(
    "interruptd.filterNone",
    () => {
      doiExplorer.filterNone();
    }
  );

  const filterHighCommand = vscode.commands.registerCommand(
    "interruptd.filterHigh",
    () => {
      doiExplorer.filterHigh();
    }
  );

  const filterMediumCommand = vscode.commands.registerCommand(
    "interruptd.filterMedium",
    () => {
      doiExplorer.filterMedium();
    }
  );

  const filterLowCommand = vscode.commands.registerCommand(
    "interruptd.filterLow",
    () => {
      doiExplorer.filterLow();
    }
  );

  return [
    generateGraphCommand,
    refreshCommand,
    filterNoneCommand,
    filterHighCommand,
    filterMediumCommand,
    filterLowCommand,
  ];
}

// This method is called when your extension is deactivated
export function deactivate() {}
