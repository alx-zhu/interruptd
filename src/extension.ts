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

  let graph: CodeGraph;
  const savedGraph = context.globalState.get<string>(`${rootPath}.graph`);
  console.log(`${rootPath}.graph`, savedGraph);
  if (savedGraph) {
    graph = CodeGraph.deserialize(savedGraph);
  } else {
    graph = new CodeGraph(rootPath);
    await graph.initialize();
  }

  const doiList = new DoiListProvider(graph, rootPath);
  vscode.window.registerTreeDataProvider("interruptdDoiList", doiList);
  console.log("Tree data provider registered");

  const doiExplorer = new DoiExplorerProvider(graph, rootPath);
  vscode.window.registerTreeDataProvider("doiExplorer", doiExplorer);
  console.log("Weighted file explorer registered");

  const neighborList = new DoiNeighborProvider(graph, rootPath);
  vscode.window.registerTreeDataProvider("neighborDoiList", neighborList);

  const listeners = registerListeners(
    context,
    graph,
    doiList,
    doiExplorer,
    neighborList
  );
  const commands = registerCommands(
    context,
    graph,
    doiList,
    doiExplorer,
    neighborList
  );

  context.subscriptions.push(...commands, ...listeners);
}

function registerListeners(
  context: vscode.ExtensionContext,
  graph: CodeGraph,
  doiList: DoiListProvider,
  doiExplorer: DoiExplorerProvider,
  neighborList: DoiNeighborProvider
) {
  return [
    // Update the graph when a document is changed
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document.uri.scheme === "file") {
        console.log(`Document changed: ${event.document.uri}`);
        graph.modifyFile(event.document.uri.fsPath);
      }
    }),

    // Update graph when a file is saved
    vscode.workspace.onDidSaveTextDocument((event) => {
      console.log(`Document saved: ${event.uri}`);
      if (event.uri.scheme === "file") {
        graph.saveFile(event.uri.fsPath);
        doiList.refresh();
        doiExplorer.refresh();
        neighborList.refresh();
      }
    }),

    // Listen for navigating to files
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor && editor.document.uri.scheme === "file") {
        console.log(`File selected: ${editor.document.uri.fsPath}`);
        graph.navToFile(editor.document.uri.fsPath);
        doiList.refresh();
        doiExplorer.refresh();
        neighborList.setCurrentPath(editor.document.uri.fsPath);
      }
    }),

    // Listen for new file creations
    vscode.workspace.onDidCreateFiles((event) => {
      for (const file of event.files) {
        if (file.scheme === "file") {
          console.log(`New file created: ${file.fsPath}`);
          graph.addFile(file.fsPath);
        }
      }
      doiList.refresh();
      doiExplorer.refresh();
      neighborList.refresh();
    }),

    // Listen for file deletion
    vscode.workspace.onDidDeleteFiles((event) => {
      for (const file of event.files) {
        if (file.scheme === "file") {
          console.log(`File deleted: ${file.fsPath}`);
          graph.removeFile(file.fsPath);
        }
      }
      doiList.refresh();
      doiExplorer.refresh();
      neighborList.refresh();
    }),

    // Listen for file renaming
    vscode.workspace.onDidRenameFiles((event) => {
      for (const { oldUri, newUri } of event.files) {
        if (oldUri.scheme === "file" && newUri.scheme === "file") {
          console.log(`File renamed from ${oldUri.fsPath} to ${newUri.fsPath}`);
          graph.renameFile(oldUri.fsPath, newUri.fsPath); // Implement this method in your graph
        }
      }
      doiList.refresh();
      doiExplorer.refresh();
      neighborList.refresh();
    }),
  ];
}

function registerCommands(
  context: vscode.ExtensionContext,
  graph: CodeGraph,
  doiList: DoiListProvider,
  doiExplorer: DoiExplorerProvider,
  neighborList: DoiNeighborProvider
) {
  return [
    vscode.commands.registerCommand("interruptd.resetGraph", () => {
      graph.resetGraph();
      doiList.refresh();
      doiExplorer.refresh();
      neighborList.refresh();
    }),

    vscode.commands.registerCommand("interruptd.resetSavedGraph", () => {
      // should it also reset the current graph?
      context.globalState.update(`${graph.getRootPath()}.graph`, undefined);
    }),

    vscode.commands.registerCommand("interruptd.generateGraph", () => {
      vscode.window.showInformationMessage("Generating Graph.");
      graph.initialize();
      doiList.refresh();
      doiExplorer.refresh();
      neighborList.refresh();
    }),

    vscode.commands.registerCommand("interruptd.saveGraph", () => {
      console.log(`${graph.getRootPath()}.graph`);
      context.globalState.update(
        `${graph.getRootPath()}.graph`,
        graph.serialize()
      );
      vscode.window.showInformationMessage("Graph Saved!");
    }),

    vscode.commands.registerCommand("interruptd.refresh", () => {
      doiList.refresh();
      doiExplorer.refresh();
      neighborList.refresh();
    }),

    vscode.commands.registerCommand("interruptd.filterNone", () => {
      doiExplorer.filterNone();
    }),

    vscode.commands.registerCommand("interruptd.filterHigh", () => {
      doiExplorer.filterHigh();
    }),

    vscode.commands.registerCommand("interruptd.filterMedium", () => {
      doiExplorer.filterMedium();
    }),

    vscode.commands.registerCommand("interruptd.filterLow", () => {
      doiExplorer.filterLow();
    }),
  ];
}

// This method is called when your extension is deactivated
export function deactivate() {}
