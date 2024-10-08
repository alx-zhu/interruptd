import * as vscode from "vscode";
import * as path from "path";
import CodeGraph from "./graph";
import { FileNode } from "./shared/fileNode";

export class DoiListProvider implements vscode.TreeDataProvider<FileNode> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    FileNode | undefined | null | void
  > = new vscode.EventEmitter<FileNode | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    FileNode | undefined | null | void
  > = this._onDidChangeTreeData.event;

  constructor(private graph: CodeGraph, private rootPath: string) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: FileNode): vscode.TreeItem {
    return element;
  }

  getChildren(element?: FileNode): Thenable<FileNode[]> {
    if (element) {
      return Promise.resolve([]);
    } else {
      const sortedNodes = this.graph.getSortedNodes();

      return Promise.resolve(
        sortedNodes.map(([filePath, node]) => {
          return new FileNode(
            filePath,
            path.relative(this.rootPath, filePath),
            vscode.TreeItemCollapsibleState.None,
            node.weight,
            false,
            {
              command: "vscode.open",
              title: "Open File",
              arguments: [vscode.Uri.file(filePath)],
            }
          );
        })
      );
    }
  }
}
