const fs = require("fs");

const base64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");
const content = "NEED+A+MAP/HOW+ABOUT+100";
const n = 200;
const waypointInterval = 4;

const map = new Map();

for (let i = 0; i < n; i++) {
    const innerMap = new Map();
    const used = new Set();
    for (const char of base64) {
        while (true) {
            const randomResult = Math.floor(Math.random() * (n - 1)) + 1;
            if (used.has(randomResult)) {
                continue;
            }

            innerMap.set(char, randomResult);
            used.add(randomResult);
            break;
        }
    }

    map.set(i, innerMap);
}

const correctPath = content.split("").reduce((path, c) => [...path, map.get(path.slice(-1)[0]).get(c)], [0]);
console.log(correctPath)

const waypoints = new Map()

for (let i = waypointInterval - 1; i < correctPath.length; i += waypointInterval) {
    waypoints.set(i, correctPath[i])
}

const memoize = (fn) => {
    let cache = new WeakMap();
    const wrap = (idx, start, path) => {
        const relevantMap = cache.get(path) ?? new Map();
        cache.set(path, relevantMap);

        const key = `${idx}-${start}`;
        if (relevantMap.has(key)) {
            return relevantMap.get(key);
        }

        const result = fn(idx, start, path);
        relevantMap.set(key, result);

        return result;
    }

    return Object.assign(wrap, { clear: () => { cache = new WeakMap(); }});
}

const pathsAt = memoize((idx, start, path) => {
    if (waypoints.has(idx)) {
        if (waypoints.get(idx) !== start) {
            return [];
        }
    }

    if (idx === path.length - 1) {
        if (start === path[idx]) {
            return [[[start], []]];
        } else {
            return [];
        }
    }

    const paths = [];
    for (const next of base64) {
        const nextIdx = map.get(start).get(next);

        for (const [nodes, edges] of pathsAt(idx + 1, nextIdx, path)) {
            paths.push([
                [start, ...nodes],
                [next, ...edges],
            ]);
        }
    }

    return paths;
});

const x = 26

for (let i = 0; i < n; i++) {
    const relevantIndices = correctPath.map((x, idx) => [x, idx]).filter(([x]) => x === i).map(([_, idx]) => idx);
    const preservedEdges = new Set(relevantIndices.map((x) => content[x]));

    for (const char of base64) {
        const next = map.get(i).get(char);
        if (!correctPath.includes(next)) {
            continue;
        }

        if (preservedEdges.has(char)) {
            continue;
        }

        while (true) {
            const nextNode = Math.floor(Math.random() * (n - 1)) + 1;
            if (nextNode === i || new Set(map.get(i).values()).has(nextNode) || correctPath.includes(nextNode)) {
                continue;
            }

            console.log("Cutting", i, char, next, "to", nextNode);
            map.get(i).set(char, nextNode);
            break;
        }
    }
}

// for (let i = 1; i < x; i++) {
//     while (true) {
//         const subpath = correctPath.slice(0, i);
//         const allPaths = pathsAt(0, correctPath[0], subpath);
//         console.log(i, allPaths)
//         const edgeToCut = i - 2;

//         if (allPaths.length === 1) {
//             break;
//         }

//         for (const [nodes, edges] of allPaths) {
//             if (nodes[edgeToCut] !== subpath[edgeToCut]) {
//                 if (correctPath.includes(nodes[edgeToCut])) {
//                     const nextIdx = correctPath.indexOf(nodes[edgeToCut]);
//                     if (content[nextIdx] === edges[edgeToCut]) {
//                         console.log("not cutting", nodes[edgeToCut])
//                         continue;
//                     }
//                 }

//                 const startNode = nodes[edgeToCut];
//                 const startEdge = edges[edgeToCut];

//                 while (true) {
//                     const nextNode = Math.floor(Math.random() * (n - 1)) + 1;
//                     if (
//                         nextNode === subpath[edgeToCut]
//                         || new Set(map.get(startNode).values()).has(nextNode)
//                     ) {
//                         continue;
//                     }

//                     console.log("Cutting", startNode, startEdge, nodes[edgeToCut], "to", nextNode);
//                     map.get(startNode).set(startEdge, nextNode);
//                     break;
//                 }
//             }
//         }

//         pathsAt.clear();
//     }
// }

console.log("Result");
console.log(pathsAt(0, correctPath[0], correctPath.slice(0, x - 1)));

const dict = Array.from(new Array(n), (_, i) => [...map.get(i).entries()].reduce((acc, [k, v]) => (acc[k] = v, acc), {}));
const output = {
    map: dict,
    content,
    correctPath,
    waypointInterval,
};


fs.writeFileSync("./output.json", JSON.stringify(output, null, 2));