import * as vscode from "vscode";
import * as path from "path";
import CodeGraph from "./graph";

class FileNode extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly weight: number,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label} (Weight: ${this.weight.toFixed(2)})`;
    this.description = this.weight.toFixed(2);
    this.iconPath = vscode.ThemeIcon.File;
  }
}

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
            path.relative(this.rootPath, filePath),
            vscode.TreeItemCollapsibleState.None,
            node.weight,
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
