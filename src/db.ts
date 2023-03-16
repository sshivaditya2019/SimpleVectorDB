import Heap from "heap-js";
import HNSW from "./index";
import fs from "fs";
import { DistanceFunction, HNSWIndex, VectorDatabase } from "./types";

class HNSWVectorDatabase<T> implements VectorDatabase<T> {
    private readonly index: HNSW<T>;
    private readonly vectors: Map<string, T> = new Map<string, T>();
    private readonly indexPath: string;

    constructor(indexPath: string, distanceFunction: DistanceFunction<T>) {
        this.indexPath = indexPath;
        try {
            const data = fs.readFileSync(indexPath, "utf-8");
            const index: HNSWIndex<T> = JSON.parse(data);
            this.index = new HNSW<T>(index.config, distanceFunction);
            this.index.nodes = index.nodes;
            for (const node of index.nodes) {
                //@ts-ignore
                this.vectors.set(node?.id, node.node.vector);
            }
        } catch (err) {
            this.index = new HNSW<T>(
                {
                    maxLevel: 6,
                    neighborSize: 32,
                    efConstruction: 200,
                },
                distanceFunction
            );
        }
    }

    public add(id: string, vector: T): void {
        this.index.addNode(id, vector);
        this.vectors.set(id, vector);
        this.saveIndex();
    }

    public search(query: T, k: number): string[] {
        const distances = new Heap<{ id: string; distance: number }>(
            (a, b) => b.distance - a.distance
        );
        for (const [id, vector] of this.vectors.entries()) {
            const distance = this.index.getDistance(query, vector);
            distances.push({ id, distance });
            if (distances.size() > k) {
                distances.pop();
            }
        }
        return distances
            .toArray()
            .reverse()
            .map((item) => item.id);
    }

    private saveIndex(): void {
        const index: HNSWIndex<T> = {
            nodes: this.index.nodes,
            config: this.index.config,
        };
        fs.writeFileSync(this.indexPath, JSON.stringify(index));
    }
}

export default HNSWVectorDatabase;
