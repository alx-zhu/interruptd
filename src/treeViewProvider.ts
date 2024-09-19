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
  }
}

export class GraphTreeDataProvider
  implements vscode.TreeDataProvider<FileNode>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    FileNode | undefined | null | void
  > = new vscode.EventEmitter<FileNode | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    FileNode | undefined | null | void
  > = this._onDidChangeTreeData.event;

  constructor(private graph: CodeGraph) {}

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
      const sortedNodes = Array.from(this.graph.getNodes().entries())
        .sort((a, b) => b[1].weight - a[1].weight)
        .slice(0, 10); // Show top 10 nodes

      return Promise.resolve(
        sortedNodes.map(([filePath, node]) => {
          return new FileNode(
            path.basename(filePath),
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
