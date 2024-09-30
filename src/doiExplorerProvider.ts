import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import CodeGraph from "./graph";
import { LOW_WEIGHT, MED_WEIGHT, HIGH_WEIGHT } from "./shared/constants";
import { FileNode } from "./shared/fileNode";

export class DoiExplorer implements vscode.TreeDataProvider<FileNode> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    FileNode | undefined | null | void
  > = new vscode.EventEmitter<FileNode | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    FileNode | undefined | null | void
  > = this._onDidChangeTreeData.event;

  constructor(
    private graph: CodeGraph,
    private rootPath: string,
    private minWeight: number = 0
  ) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
    console.log("Min Weight: ", this.minWeight);
  }

  // Placeholder for refreshing a specific file path instead of all nodes.
  refreshPath(path: string) {}

  getTreeItem(element: FileNode): vscode.TreeItem {
    return element;
  }

  // Set filters to default values without exposin
  filterNone() {
    this.minWeight = 0;
    this.refresh();
  }

  filterHigh() {
    this.minWeight = HIGH_WEIGHT;
    this.refresh();
  }

  filterMedium() {
    this.minWeight = MED_WEIGHT;
    this.refresh();
  }

  filterLow() {
    this.minWeight = LOW_WEIGHT;
    this.refresh();
  }

  getChildren(element?: FileNode): vscode.ProviderResult<FileNode[]> {
    if (!this.rootPath) {
      vscode.window.showInformationMessage("No workspace selected");
      return Promise.resolve([]);
    }

    if (element) {
      return this.getFileNodes(element.fullPath);
    } else {
      return this.getFileNodes(this.rootPath);
    }
  }

  private async getFileNodes(dirPath: string): Promise<FileNode[]> {
    const entries = await fs.promises.readdir(dirPath, {
      withFileTypes: true,
    });
    const nodes = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dirPath, entry.name);
        const weight = this.graph.getNodeWeight(fullPath);

        if (entry.name.startsWith(".")) {
          return;
        }

        if (entry.isDirectory()) {
          const children = await this.getFileNodes(fullPath);
          const folderWeight = children.reduce(
            (max, child) => Math.max(max, child.weight),
            0
          );

          return new FileNode(
            fullPath,
            entry.name,
            folderWeight >= this.minWeight && this.minWeight > 0 // Only expand folders by default if minWeight is set
              ? vscode.TreeItemCollapsibleState.Expanded
              : vscode.TreeItemCollapsibleState.Collapsed,
            folderWeight,
            true
          );
        } else {
          if (weight >= this.minWeight) {
            return new FileNode(
              fullPath,
              entry.name,
              vscode.TreeItemCollapsibleState.None,
              weight,
              false,
              {
                command: "vscode.open",
                title: "Open File",
                arguments: [vscode.Uri.file(fullPath)],
              }
            );
          }
        }
      })
    );

    return nodes.filter((node) => node !== undefined);
  }
}
