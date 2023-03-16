
interface node<T> {
    id: string;
    vector: T;
    neighbors: Array<string | null>;
    level: number;
  }

interface Config {
  maxLevel: number;
  neighborSize: number;
  efConstruction: number;
}

type DistanceFunction<T> = (a: T, b: T) => number;

interface VectorDatabase<T> {
    add(id: string, vector: T): void;
    search(query: T, k: number): string[];
  }
  
  interface HNSWIndex<T> {
    nodes: Map<string, node<T>>;
    config: Config;
  }
  
export {node, Config, DistanceFunction, VectorDatabase, HNSWIndex}