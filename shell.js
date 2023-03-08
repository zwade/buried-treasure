const fs = require("fs");
const vlq = require("vlq");
const path = require("path");

const template = fs.readFileSync(path.join(__dirname, "./templates/template.js"));
const html = fs.readFileSync(path.join(__dirname, "./templates/index.html"))
const success = fs.readFileSync(path.join(__dirname, "./templates/success.js"))
const fail = fs.readFileSync(path.join(__dirname, "./templates/fail.js"))
const maze = JSON.parse(fs.readFileSync(path.join(__dirname, "./output.json")));
const base64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");

const encodeRanges = (ranges) => {
    let state = [0, 0, 0, 0, 0, 0];
    let result = "";
    for (const range of ranges) {
        const [startLine, startColumn, file, endLine, endColumn, word] = range;
        const lineNumber = startLine - state[0];
        if (lineNumber > 0) {
            state[1] = 0;
        }

        const vlqData = [
            startColumn - state[1],
            file - state[2],
            endLine - state[3],
            endColumn - state[4],
        ]

        if (word !== undefined) {
            vlqData.push(word - state[5]);
        }

        state = [startLine, startColumn, file, endLine, endColumn, word]
        if (lineNumber > 0) {
            result += ";".repeat(lineNumber);
        } else {
            result += ",";
        }
        result += vlq.encode(vlqData);
    }

    return result;
}

for (let i = 0; i < maze.map.length; i++) {
    const fileToWrite = template.toString().replace("{{mapUrl}}", `${i}.js.map`);
    const indexOfBang = template.toString().indexOf("!");
    const prefix = template.toString().slice(0, indexOfBang);
    const lineOfBang = prefix.split("\n").length;
    const columnOfBang = prefix.split("\n").slice(-1)[0].length + 1;

    const isEnd = i === maze.correctPath[maze.correctPath.length - 1];
    console.log(isEnd, i);

    const addl = [
        [65, 0, maze.map.length, 0, 0],
    ]

    if (isEnd) {
        addl.push(
            [lineOfBang - 1, columnOfBang, maze.map.length + 1, 0, 0],
            [lineOfBang - 1, columnOfBang + 1, maze.map.length, 0, 0],
        )
    }

    const sourceMap = {
        "version": 3,
        "sources": maze.map.map((_, i) => `${i}.js`).concat(["fail.js", "success.js"]),
        "mappings": encodeRanges(
            base64.map((char, charI) => [charI + 1, 0, maze.map[i][char], 0, 0])
            .concat(addl)
        ),
    }

    fs.writeFileSync(`./outdir/${i}.js.map`, JSON.stringify(sourceMap));
    fs.writeFileSync(`./outdir/${i}.js`, fileToWrite);
}

const updatedHTML = html.toString().replace("{{scripts}}", `<script type="module">\n${maze.map.map((_, i) => `import "./${i}.js";\n`).join("")}</script>`);

fs.writeFileSync(`./outdir/index.html`, updatedHTML);
fs.writeFileSync(`./outdir/success.js`, success);
fs.writeFileSync(`./outdir/fail.js`, fail);