import * as fs from "fs/promises";
import * as path from "path";

interface FileNode {
  weight: number;
}

// TODO: How to handle when files move or are deleted?
// - Need to add some form of listener for the CRUD operations of files
// - Update nodes on save
// - How to update graph when a new file and import statement is added (i.e. a new edge is added)?
// - Is it possible to detect when a new edge has been added?

class CodeGraph {
  // Constants
  private MODIFYWEIGHT: number = 0.1;
  private NAVWEIGHT: number = 0.05;
  private DECAYWEIGHT: number = 0.001;
  private CODEEXTS: string[] = [".ts", ".js"];

  private nodes: Map<string, FileNode> = new Map();
  private edges: Map<string, Set<string>> = new Map();
  private rootPath: string;

  constructor(rootPath: string) {
    // this.rootPath = rootPath;
    this.rootPath = path.join(rootPath, "src");
    console.log(this.rootPath);
  }

  async initialize() {
    await this.constructGraph(this.rootPath);
  }

  private async constructGraph(rootPath: string) {
    // iterative BFS to save memory
    const queue = [rootPath];
    while (queue.length > 0) {
      const dirPath = queue.shift()!;
      const files = await fs.readdir(dirPath, { withFileTypes: true });
      // For loop allows for await to be used
      for (const file of files) {
        const filePath = path.resolve(dirPath, file.name);
        if (file.isDirectory()) {
          queue.push(filePath);
        } else if (this.isCodeFile(filePath)) {
          // Add node only adds a node if it hasn't already been added
          this.addNode(filePath);
          // Add all of the dependencies as edges. Edges are sets, so adding duplicates has no effect.
          await this.addEdgesFromFile(filePath);
        }
      }
    }
  }

  // Parses the file and adds the dependencies as edges
  private async addEdgesFromFile(filePath: string) {
    try {
      const content = await fs.readFile(filePath, "utf8");
      this.extractDependencies(filePath, content).forEach((dep) => {
        const absolutePath = path.resolve(path.dirname(filePath), dep);
        this.addEdge(filePath, absolutePath);
      });
    } catch (error) {
      console.error(`Error parsing file ${filePath}:`, error);
    }
  }

  // Generalizable function to extract dependencies from any file content
  private extractDependencies(filePath: string, content: string): string[] {
    const ext = path.extname(filePath).toLowerCase();
    const dependencies: string[] = [];

    console.log("Extracting dependencies for " + filePath);

    if (ext === ".ts" || ext === ".js") {
      const importRegex = /from\s+['"](.+?)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        dependencies.push(match[1]);
      }
    }
    return dependencies;
  }

  private isCodeFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return this.CODEEXTS.includes(ext);
  }

  private addNode(filePath: string, weight: number = 0) {
    let updatedPath = filePath;
    if (!path.extname(filePath)) {
      updatedPath = `${filePath}.ts`;
    }
    if (!this.nodes.has(updatedPath)) {
      this.nodes.set(updatedPath, { weight });
    }
  }

  private addEdge(startPath: string, endPath: string) {
    this.addNode(startPath);
    this.addNode(endPath);
    if (!this.edges.has(startPath)) {
      this.edges.set(startPath, new Set());
    }
    if (!this.edges.has(endPath)) {
      this.edges.set(endPath, new Set());
    }

    this.edges.get(startPath)?.add(endPath);
    this.edges.get(endPath)?.add(startPath);
  }

  private updateWeight(filePath: string, addedWeight: number) {
    this.addNode(filePath);
    const node = this.nodes.get(filePath)!;
    this.nodes.set(filePath, { weight: node.weight + addedWeight });
  }

  // Lazy updating of decays, edits, updates (for the future)
  // private lazyDecayWeights() {}
  // lazyEditFile() {}
  // lazyNavToFile() {}

  private decayWeights() {
    this.nodes.forEach((node) => {
      node.weight = Math.max(0, node.weight - this.DECAYWEIGHT);
    });
  }

  modifyFile(filePath: string) {
    this.updateWeight(filePath, this.MODIFYWEIGHT);
    this.decayWeights();
  }

  navToFile(filePath: string) {
    this.updateWeight(filePath, this.NAVWEIGHT);
    this.decayWeights();
  }

  displayGraph() {
    console.log(this.nodes, this.edges);
  }

  getNodes(): Map<string, FileNode> {
    return this.nodes;
  }

  getRootPath(): string {
    return this.rootPath;
  }
}

export default CodeGraph;
