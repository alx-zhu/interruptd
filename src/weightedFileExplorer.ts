import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import CodeGraph from "./graph";

class FileNode extends vscode.TreeItem {
  constructor(
    public readonly fullPath: string,
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly weight: number,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label} (Weight: ${this.weight.toFixed(2)})`;
    this.description = this.weight.toFixed(2);
    // this.iconPath = this.getColoredIcon();
    this.iconPath = this.getIcon();
  }

  private getIcon(): vscode.ThemeIcon {
    if (this.weight > 100) {
      return new vscode.ThemeIcon(
        "circle-filled",
        new vscode.ThemeColor("charts.red")
      );
    } else if (this.weight > 50) {
      return new vscode.ThemeIcon(
        "circle-filled",
        new vscode.ThemeColor("charts.yellow")
      );
    } else if (this.weight > 25) {
      return new vscode.ThemeIcon(
        "circle-filled",
        new vscode.ThemeColor("charts.green")
      );
    } else {
      return new vscode.ThemeIcon("circle-outline");
    }
  }
}

export class WeightedFileExplorer implements vscode.TreeDataProvider<FileNode> {
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

  // Placeholder for refreshing a specific file path instead of all nodes.
  refreshPath(path: string) {}

  getTreeItem(element: FileNode): vscode.TreeItem {
    return element;
  }

  getChildren(element?: FileNode): vscode.ProviderResult<FileNode[]> {
    if (!this.rootPath) {
      vscode.window.showInformationMessage("No workspace selected");
      return Promise.resolve([]);
    }

    if (element) {
      console.log("Getting children for", element.fullPath);
      return this.getFileNodes(element.fullPath);
    } else {
      return this.getFileNodes(this.rootPath);
    }
  }

  private async getFileNodes(dirPath: string): Promise<FileNode[]> {
    const entries = await fs.promises.readdir(dirPath, {
      withFileTypes: true,
    });
    return await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dirPath, entry.name);
        const uri = vscode.Uri.file(fullPath);
        const weight = this.graph.getNodeWeight(fullPath);

        if (entry.isDirectory()) {
          const children = await this.getFileNodes(fullPath);
          const folderWeight = children.reduce(
            (sum, child) => sum + child.weight,
            0
          );

          return new FileNode(
            fullPath,
            path.relative(dirPath, uri.fsPath),
            vscode.TreeItemCollapsibleState.Collapsed,
            folderWeight
          );
        } else {
          return new FileNode(
            fullPath,
            path.relative(dirPath, uri.fsPath),
            vscode.TreeItemCollapsibleState.None,
            weight,
            {
              command: "vscode.open",
              title: "Open File",
              arguments: [vscode.Uri.file(fullPath)],
            }
          );
        }
      })
    );
  }
}
