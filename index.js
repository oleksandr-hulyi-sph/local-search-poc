var lunr = require("elasticlunr");
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

function test(dataset) {

    var stats = fs.statSync(dataset)
    console.log(`Dataset size: ${stats.size / 1000000} Mb`)

    var files = JSON.parse(fs.readFileSync(dataset));
    console.log("Dataset count: " + files.length);

    var finaldoc = files.shift();
    var index = null;

    measure("Indexing", () => {
        index = lunr(function () {
            this.setRef('id');
            this.addField('data');
            var i = this;

            files.forEach(f => i.addDoc(f));
        });
    });

    measure("Search", () => {
        var results = index.search("ugly");
        console.log("Results found:" + results.length);
    });

    measure("Add-to-index", ()=>{
        index.addDoc(finaldoc);
    });   
}


test("/mnt/c/datasets/email.dat");