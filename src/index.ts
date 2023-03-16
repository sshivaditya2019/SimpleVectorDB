import _ from "lodash";
import Heap from "heap-js";

import { node, Config, DistanceFunction, VectorDatabase } from "./types";
class HNSW<T> {
    public nodes: Map<string, node<T>>;
    public config: Config;
    public distanceFunction: DistanceFunction<T>;

    constructor(config: Config, distanceFunction: DistanceFunction<T>) {
        this.nodes = new Map<string, node<T>>();
        this.config = config;
        this.distanceFunction = distanceFunction;
    }

    public addNode(id: string, vector: T): void {
        const level = this.getRandomLevel();
        const node: node<T> = {
            id,
            vector,
            neighbors: new Array(this.config.maxLevel).fill(null),
            level,
        };
        this.nodes.set(node.id, node);
        this.addToGraph(node, level);
    }

    private addToGraph(node: node<T>, level: number): void {
        if (level === 0) {
            return;
        }

        const neighbors = this.getNeighbors(node, level - 1);
        const heap = new Heap<{ id: string; distance: number }>(
            (a, b) => a.distance - b.distance
        );

        for (const neighborId of neighbors) {
            const neighbor = this.nodes.get(neighborId);
            //@ts-ignore
            const distance = this.distanceFunction(
                node.vector,
                neighbor?.vector
            );
            heap.push({ id: neighborId, distance });

            if (heap.size() > this.config.efConstruction) {
                heap.pop();
            }
        }

        for (let i = heap.size() - 1; i >= 0; i--) {
            const neighborId = heap.peek()?.id as string;
            const neighbor = this.nodes.get(neighborId);
            node.neighbors[level - 1] = neighborId;
            //@ts-ignore
            neighbor.neighbors[level] = node.id;
        }
    }

    private getRandomLevel(): number {
        let level = 0;
        while (Math.random() < 0.5 && level < this.config.maxLevel - 1) {
            level++;
        }
        return level;
    }

    private getNeighbors(node: node<T>, level: number): string[] {
        if (level === 0) {
            return [];
        }

        const neighbors = [];
        let neighborId = node.neighbors[level - 1];
        while (neighborId !== null) {
            neighbors.push(neighborId);
            let neighbor = this.nodes.get(neighborId);
            neighborId = neighbor ? neighbor.neighbors[level - 1] : null;
        }
        return neighbors;
    }

    public getDistance(a: T, b: T): number {
        return this.distanceFunction(a, b);
    }
}

export default HNSW;
