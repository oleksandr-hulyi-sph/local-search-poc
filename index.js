var lunr = require("elasticlunr");
const Fuse = require('fuse.js');
const MiniSearch = require('minisearch');
var fs = require("fs");


function readTexts(dir) {
    var entries = fs.readdirSync(dir, { withFileTypes: true });

    var data = entries.filter(e => e.isFile()).map(element => {

        var file = `${dir}/${element.name}`;

        console.log(file);

        var data = fs.readFileSync(file, "utf8");
        data = data.substring(data.indexOf('\n\n') + 2);

        return { id: file, data: data };
    });

    var result = entries.filter(e => e.isDirectory()).map(
        e => readTexts(`${dir}/${e.name}`)).reduce((p, c, i) => {
            return p.concat(c);
        }, data);

    return result;
}

function measure(desc, action) {
    hrstart = process.hrtime();
    action();
    hrend = process.hrtime(hrstart)
    console.info(`${desc} | Took: ${hrend[0]}s ${hrend[1] / 1000000}ms`);
}

function prepare() {

    var files = readTexts("/mnt/c/datasets/email");
    fs.writeFileSync("/mnt/c/datasets/email.dat", JSON.stringify(files));
    console.log("done");
}

function test(dataset, size) {

    var files = JSON.parse(fs.readFileSync(dataset)).slice(0, size);
    console.log("Dataset count: " + files.length);
    console.log(`Dataset size: ${JSON.stringify(files).length / 1000000}Mb`);

    const options = {
        fields: ['data'], // fields to index for full-text search
        storeFields: ['id'] // fields to return with search results
    };
    var finaldoc = files.shift();
    var idxStr = null;
    var fuse;

    measure("Indexing", () => {
        index = new MiniSearch(options);
        index.addAll(files);
    });

    measure("Store index", () => {
        idxStr = JSON.stringify(index);
        console.log(`Index size: ${idxStr.length / 1000000}Mb`);
    });

    measure("Load index", () => {
        index = MiniSearch.loadJSON(idxStr, options);
    });

    measure("Search", () => {
        var results = index.search("vacation");
        console.log("Results found:" + results.length);
    });

    measure("Add-to-index", () => {
        index.add(finaldoc);
    });
}

var sampleCount = process.argv.slice(2)[0];
if(!sampleCount)
    sampleCount = 10000;

test("./email.dat", sampleCount);