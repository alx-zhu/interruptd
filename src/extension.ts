import * as vscode from "vscode";
import CodeGraph from "./graph";
import { DoiListProvider } from "./doiListProvider";
import { DoiNeighborProvider } from "./doiNeighborProvider";
import { DoiExplorerProvider } from "./doiExplorerProvider";

export async function activate(context: vscode.ExtensionContext) {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders) {
    vscode.window.showErrorMessage("No workspace folder open");
    return;
  }

  const rootPath = folders[0].uri.fsPath;

  const graph = new CodeGraph(rootPath);
  await graph.initialize();
  graph.displayGraph();

  const doiList = new DoiListProvider(graph, rootPath);
  vscode.window.registerTreeDataProvider("interruptdDoiList", doiList);
  console.log("Tree data provider registered");

  const doiExplorer = new DoiExplorerProvider(graph, rootPath);
  vscode.window.registerTreeDataProvider("doiExplorer", doiExplorer);
  console.log("Weighted file explorer registered");

  const neighborList = new DoiNeighborProvider(graph, rootPath);
  vscode.window.registerTreeDataProvider("neighborDoiList", neighborList);

  const listeners = registerListeners(
    graph,
    doiList,
    doiExplorer,
    neighborList
  );
  const commands = registerCommands(graph, doiList, doiExplorer, neighborList);

  context.subscriptions.push(...commands, ...listeners);
}

function registerListeners(
  graph: CodeGraph,
  doiList: DoiListProvider,
  doiExplorer: DoiExplorerProvider,
  neighborList: DoiNeighborProvider
) {
  // Update the graph when a document is changed
  const onFileChangeListener = vscode.workspace.onDidChangeTextDocument(
    (event) => {
      if (event.document.uri.scheme === "file") {
        console.log(`Document changed: ${event.document.uri}`);
        graph.modifyFile(event.document.uri.fsPath);
      }
    }
  );

  // Update graph when a file is saved
  const onFileSaveListener = vscode.workspace.onDidSaveTextDocument((event) => {
    console.log(`Document saved: ${event.uri}`);
    if (event.uri.scheme === "file") {
      graph.saveFile(event.uri.fsPath);
      doiList.refresh();
      doiExplorer.refresh();
      neighborList.refresh();
    }
  });

  // Listen for navigating to files
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

  // Listen for new file creations
  const onFileCreateListener = vscode.workspace.onDidCreateFiles((event) => {
    for (const file of event.files) {
      if (file.scheme === "file") {
        console.log(`New file created: ${file.fsPath}`);
        graph.addFile(file.fsPath);
      }
    }
    doiList.refresh();
    doiExplorer.refresh();
    neighborList.refresh();
  });

  // Listen for file deletion
  const onFileDeleteListener = vscode.workspace.onDidDeleteFiles((event) => {
    for (const file of event.files) {
      if (file.scheme === "file") {
        console.log(`File deleted: ${file.fsPath}`);
        graph.removeFile(file.fsPath);
      }
    }
    doiList.refresh();
    doiExplorer.refresh();
    neighborList.refresh();
  });

  // Listen for file renaming
  const onFileRenameListener = vscode.workspace.onDidRenameFiles((event) => {
    for (const { oldUri, newUri } of event.files) {
      if (oldUri.scheme === "file" && newUri.scheme === "file") {
        console.log(`File renamed from ${oldUri.fsPath} to ${newUri.fsPath}`);
        graph.renameFile(oldUri.fsPath, newUri.fsPath); // Implement this method in your graph
      }
    }
    doiList.refresh();
    doiExplorer.refresh();
    neighborList.refresh();
  });

  return [
    onFileChangeListener,
    onFileSaveListener,
    onFileSelectListener,
    onFileCreateListener,
    onFileDeleteListener,
    onFileRenameListener,
  ];
}

function registerCommands(
  graph: CodeGraph,
  doiList: DoiListProvider,
  doiExplorer: DoiExplorerProvider,
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
