const test = require('tap').test;
const data = require('../../src/extensions/data_tools/index.js');
const Runtime = require('../../src/engine/runtime');

const dataset = [ {name:'mikey', age:25 }, {name:'joe', age:36}, {name:'steve', age:85}];
const fileName = "fileName";

// Tests adding a data file
test('Adding Data File to extension', t => {
    let runtime = new Runtime();
    let blocks = new data(runtime);
    blocks.addDataFile(fileName, dataset);
    let fileNames = blocks.getFileNames();
    t.strictEqual(fileNames[0], 'fileName');
    let output = blocks.getDataFileContents(fileName);
    t.equal(output[0].name, dataset[0].name);
    t.equal(output[0].age, dataset[0].age);
    t.equal(blocks._fileBlocks[0].text, 'fileName');
    t.equal(blocks._fileBlocks[0].opcode, 'file_fileName');
    t.end();
});

// Tests adding a data file and then removing that data file
test('Removing a Data file from the extension', t =>{
    let runtime = new Runtime();
    let blocks = new data(runtime);
    let bool = blocks.removeDataFile('file');
    t.equal(bool, false);
    blocks.addDataFile('file', dataset);
    let fileNames = blocks.getFileNames();
    t.strictEqual(fileNames[0], 'file');
    bool =  blocks.removeDataFile('file');
    t.equal(bool, true);
    fileNames = blocks.getFileNames();
    t.strictEqual("", fileNames[0]);
    t.end();
});

// Added a data file and duplicate it using the default value and a new name
test('Duplicate a dataset', t => {
    let runtime = new Runtime();
    let blocks = new data(runtime);
    blocks.addDataFile('fileName', dataset);
    blocks.duplicateDataset({ORIGINAL: 'fileName', NEW: ' '});
    t.equal(blocks.getFileNames()[1], 'fileName (1)');
    t.equal(blocks._files['fileName'][1].age, blocks._files['fileName (1)'][1].age);
    t.equal(blocks._files['fileName'][0].name, blocks._files['fileName (1)'][0].name);

    blocks.duplicateDataset({ORIGINAL: 'fileName', NEW: 'test'});
    t.equal(blocks.getFileNames()[2], 'test');
    t.equal(blocks._files['fileName'][1].age, blocks._files['test'][1].age);
    t.equal(blocks._files['fileName'][0].name, blocks._files['test'][0].name);
    t.end();
});

// Getting the row count of dataset
test('Getting the row count of a dataset', t=> {
    let runtime = new Runtime();
    let blocks = new data(runtime);
    t.equal(blocks.getRowCount({FILENAME: 'fileName'}), 0);
    blocks.addDataFile('fileName', dataset);
    t.equal(blocks.getRowCount({FILENAME: 'fileName'}), 3);
    t.end();
});

// generateColumnData for menu
test('Testing generateColumnData for menu', t =>{
    let runtime = new Runtime();
    let blocks = new data(runtime);
    t.equal(blocks.generateColumnData()[''][0], 'NO FILES UPLOADED');
    blocks.addDataFile('fileName', dataset);
    t.equal(blocks.generateColumnData()['fileName'][0], 'name');
    t.equal(blocks.generateColumnData()['fileName'][1], 'age');
    t.end();
});

// updateDataFileFromTable called when the file is edited in the file view menu
test('Changing a file in the file view', t =>{
    let runtime = new Runtime();
    let blocks = new data(runtime);
    blocks.addDataFile('fileName', dataset);
    blocks.updateDataFileFromTable('fileName', 0, 'name', 'Roger');
    t.equal(blocks._files['fileName'][0].name, 'Roger');
    blocks.updateDataFileFromTable('fileName', 0, 'age', 100);
    t.equal(blocks._files['fileName'][0].age, 100);
    t.end();
})

// Modifying an existing row
test('Modifying an existing row of a dataset', t => {
    runtime = new Runtime();
    blocks = new data(runtime);
    blocks.addDataFile('fileName', dataset);
    // let args = {COLUMN: '[fileName] age', ROW: 1, VALUE: 15};
    // blocks.setColumnAtRow(args);
    // t.equal(blocks.getColumnAtRow({COLUMN: '[fileName] age', ROW: 1}), 15);
    blocks.setColumnAtRow({COLUMN: '[fileName] name', ROW: 2, VALUE: "Roger"});
    t.equal(blocks.getColumnAtRow({COLUMN: '[fileName] name', ROW: 2}), 'Roger');
    t.end(); 
});

// Modifying a row, edge cases
test('Modifying a row edge cases', t=>{
    runtime = new Runtime();
    blocks = new data(runtime);
    let args = {COLUMN: '[file] age', ROW: 3, VALUE: '10'};
    let out = blocks.setColumnAtRow(args);
    t.equal(out, ''); // testing if the file does not exist
    blocks.addDataFile('file', dataset);
    args = {COLUMN: '[file] age', ROW: 4, VALUE: '100'}
    out = blocks.setColumnAtRow(args);
    t.equal(out, '');// testing if the row does not exist
    args = {COLUMN: '[file] age', ROW: 0, VALUE: '100' };
    out = blocks.setColumnAtRow(args);
    t.equal(out, '');// testing if the row is less than 1
    t.end();
});

//Adding a row to the data file, checking that the row was added properly
test('Adding a blank row to a dataset', t => {
    runtime = new Runtime();
    blocks = new data(runtime);
    blocks.addDataFile('fileName', dataset);
    let arg = { FILENAME: 'fileName'};
    blocks.addDataFileRow(arg);
    let args = {COLUMN: '[fileName] age', ROW: 4};
    let result = blocks.getColumnAtRow(args);
    t.strictEqual(0, result);
    args = {COLUMN: '[fileName] name', ROW: 4};
    result = blocks.getColumnAtRow(args);
    t.strictEqual('', result);
    t.end();
});

