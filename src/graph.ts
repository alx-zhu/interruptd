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
  private MODIFYWEIGHT: number = 1;
  private NAVWEIGHT: number = 10;
  private DECAYWEIGHT: number = 0.05;
  private DECAYFACTOR: number = 0.2;
  private MAX_DEPTH: number = 1;
  private CODEEXTS: string[] = [".ts"];

  private nodes: Map<string, FileNode> = new Map();
  private edges: Map<string, Set<string>> = new Map();
  private rootPath: string;

  constructor(rootPath: string) {
    this.rootPath = path.join(rootPath, "src");
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
        } else {
          // Add node only adds a node if it hasn't already been added
          this.addNode(filePath);
          if (this.isCodeFile(filePath)) {
            // Add all of the dependencies as edges. Edges are sets, so adding duplicates has no effect.
            await this.addEdgesFromFile(filePath);
          }
        }
      }
    }
  }

  private updateGraph() {
    // TODO: Update graph when a new file and import statement is added
    // - Can track if new import statements added using diff
    // When a new file is added, add the node and all of its dependencies to the graph
    // When a new import statement is added, add the edge to the graph
  }

  // Parses the file and adds the dependencies as edges
  private async addEdgesFromFile(filePath: string) {
    const dependencies = await this.extractAbsoluteDependencies(filePath);
    dependencies.forEach((dep) => {
      this.addEdge(filePath, dep);
    });
  }

  // Generalizable function to extract dependencies from any file content. Returns absolute paths.
  private async extractAbsoluteDependencies(
    filePath: string
  ): Promise<string[]> {
    try {
      const content = await fs.readFile(filePath, "utf8");
      const ext = path.extname(filePath).toLowerCase();
      const dependencies: string[] = [];

      if (ext === ".ts") {
        const importRegex = /from\s+['"](.+?)['"]/g;
        let match;
        while ((match = importRegex.exec(content)) !== null) {
          const importPath = match[1];
          // Only include relative imports or absolute imports within the project
          if (importPath.startsWith(".") || importPath.startsWith("/")) {
            const absolutePath = path.resolve(
              path.dirname(filePath),
              importPath
            );
            dependencies.push(absolutePath);
          }
        }
      }
      return dependencies;
    } catch (error) {
      console.error(`Error parsing file ${filePath}:`, error);
      return [];
    }
  }

  private isCodeFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return this.CODEEXTS.includes(ext);
  }

  private addNode(filePath: string, weight: number = 0) {
    let updatedPath = filePath;
    // Assumes file extension is .ts
    if (!path.extname(filePath)) {
      updatedPath = `${filePath}.ts`;
    }
    if (!this.nodes.has(updatedPath)) {
      this.nodes.set(updatedPath, { weight });
    }
    return updatedPath;
  }

  private addEdge(startPath: string, endPath: string) {
    const updatedStartPath = this.addNode(startPath);
    const updatedEndPath = this.addNode(endPath);
    if (!this.edges.has(updatedStartPath)) {
      this.edges.set(updatedStartPath, new Set());
    }
    if (!this.edges.has(updatedEndPath)) {
      this.edges.set(updatedEndPath, new Set());
    }

    this.edges.get(updatedStartPath)?.add(updatedEndPath);
    this.edges.get(updatedEndPath)?.add(updatedStartPath);
  }

  private addWeight(
    filePath: string,
    addedWeight: number,
    propagate: boolean = true,
    depth: number = 0
  ) {
    if (this.nodes.has(filePath)) {
      const node = this.nodes.get(filePath)!;
      this.nodes.set(filePath, {
        weight: node.weight + addedWeight * Math.pow(this.DECAYFACTOR, depth),
      });
      // Update all of the nodes that depend on the updated node
      if (propagate && depth <= this.MAX_DEPTH) {
        this.edges.get(filePath)?.forEach((dep) => {
          this.addWeight(dep, addedWeight, propagate, depth + 1);
        });
      }
    }
  }

  private decayWeights() {
    this.nodes.forEach((node) => {
      node.weight = Math.max(0, node.weight - this.DECAYWEIGHT);
    });
  }

  // Updates the dependencies of a file after it has been modified
  private async updateNodeDependencies(filePath: string) {
    const dependencies = await this.extractAbsoluteDependencies(filePath);
    const newDependencies = dependencies.filter(
      (dep) => !this.edges.get(filePath)?.has(dep)
    );
    newDependencies.forEach((dep) => {
      this.addEdge(filePath, dep);
    });
  }

  // Graph Modifiers
  addFile(filePath: string) {
    this.addNode(filePath);
    // this.addEdgesFromFile(filePath); // TODO: Can add weights while adding edges maybe?
    // this.getNodeNeighbors(filePath).forEach((neighbor) => {
    //   this.addWeight(filePath, this.getNodeWeight(neighbor) * this.DECAYFACTOR);
    // });
  }

  saveFile(filePath: string) {
    this.updateNodeDependencies(filePath);
  }

  modifyFile(filePath: string) {
    this.addWeight(filePath, this.MODIFYWEIGHT);
    this.decayWeights();
  }

  navToFile(filePath: string) {
    this.addWeight(filePath, this.NAVWEIGHT);
    this.decayWeights();
  }

  displayGraph() {
    console.log(this.nodes, this.edges);
  }

  // Getters
  getNodeWeight(filePath: string): number {
    return this.nodes.get(filePath)?.weight || 0;
  }

  getNodeNeighbors(filePath: string): Set<string> {
    return this.edges.get(filePath) || new Set();
  }

  getSortedNodes(): [string, FileNode][] {
    return Array.from(this.nodes.entries()).sort(
      (a, b) => b[1].weight - a[1].weight
    );
  }

  getSortedNeighbors(filePath: string): [string, FileNode][] {
    const neighbors = this.getNodeNeighbors(filePath);
    return this.getSortedNodes().filter((node) => neighbors.has(node[0]));
  }

  // getNodes(): Map<string, FileNode> {
  //   return this.nodes;
  // }

  getRootPath(): string {
    return this.rootPath;
  }
}

export default CodeGraph;
