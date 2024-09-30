import * as vscode from "vscode";
import { LOW_WEIGHT, MED_WEIGHT, HIGH_WEIGHT } from "./constants";

export class FileNode extends vscode.TreeItem {
  constructor(
    public readonly fullPath: string,
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly weight: number,
    public readonly isDirectory: boolean = false,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label} (Weight: ${this.weight.toFixed(2)})`;
    this.description = this.weight > 0 ? this.weight.toFixed(2) : "";
    this.iconPath = this.getIcon();
  }

  private getIcon(): vscode.ThemeIcon | undefined {
    let color: vscode.ThemeColor;

    if (this.weight > HIGH_WEIGHT) {
      color = new vscode.ThemeColor("charts.red");
    } else if (this.weight > MED_WEIGHT) {
      color = new vscode.ThemeColor("charts.yellow");
    } else if (this.weight > LOW_WEIGHT) {
      color = new vscode.ThemeColor("charts.green");
    } else {
      color = new vscode.ThemeColor("charts.gray");
    }

    if (this.isDirectory) {
      return new vscode.ThemeIcon("folder", color);
    } else {
      return this.weight >= LOW_WEIGHT
        ? new vscode.ThemeIcon("circle-filled", color)
        : undefined;
    }
  }
}
