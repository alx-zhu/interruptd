import * as vscode from "vscode";
import * as path from "path";
import CodeGraph from "./graph";
import { FileNode } from "./shared/fileNode";

export class DoiNeighborProvider implements vscode.TreeDataProvider<FileNode> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    FileNode | undefined | null | void
  > = new vscode.EventEmitter<FileNode | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    FileNode | undefined | null | void
  > = this._onDidChangeTreeData.event;

  constructor(private graph: CodeGraph, private currentPath: string) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  setCurrentPath(newPath: string) {
    this.currentPath = newPath;
    this.refresh();
  }

  getTreeItem(element: FileNode): vscode.TreeItem {
    return element;
  }

  getChildren(element?: FileNode): Thenable<FileNode[]> {
    if (element) {
      return Promise.resolve([]);
    } else {
      const neighborNodes = this.graph.getSortedNeighbors(this.currentPath);

      return Promise.resolve(
        neighborNodes.map(([filePath, node]) => {
          return new FileNode(
            filePath,
            path.relative(this.currentPath, filePath),
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
