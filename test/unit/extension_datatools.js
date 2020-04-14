
const test = require('tap').test;
const data = require('../../src/extensions/data_tools/index.js');
const Runtime = require('../../src/engine/runtime');

const dataset = [ {name:'mikey', age:25 }, {name:'joe', age:36}, {name:'steve', age:85}];
const fileName = "fileName";

// Tests adding a data file
test('Adding Data File to extension', t => {
    let runtime = new Runtime();
    let blocks = new data(runtime);

    blocks.addDataFile(fileName, [ {name:'mikey', age:25 }, {name:'joe', age:36}, {name:'steve', age:85}]);
    let fileNames = blocks.getFileNames();
    t.strictEqual(fileNames[0], 'fileName', "fileName is loaded properly into extension");
    let output = blocks.getDataFileContents(fileName);
    t.equal(output[0].name, dataset[0].name, "data is added properly to extension from file");
    t.equal(output[0].age, dataset[0].age), "data is added properly to extension from file";
    t.equal(blocks._fileBlocks[0].text, 'fileName', "file block for the new file created properly");
    t.equal(blocks._fileBlocks[0].opcode, 'file_fileName', "file block for the new file created properly");

    blocks.addDataFile('file', []);//adding a data file with no contents
    t.notEqual(blocks.getFileNames()[1], 'file', "the file name should not have been added because there was no data");

    blocks.addDataFile(fileName, [ {name:'mikey', age:25 }, {name:'joe', age:36}, {name:'steve', age:85}]);
    t.equal(blocks.getFileNames()[1], 'fileName (1)', "File added with same name, name should be updated to fileName (1)" );
    t.end();
});

// Tests adding a data file and then removing that data file
test('Removing a Data file from the extension', t =>{
    let runtime = new Runtime();
    let blocks = new data(runtime);

    let bool = blocks.removeDataFile('file');
    t.equal(bool, false, "removeDataFile should return false because no file has been uploaded");
    
    blocks.addDataFile('file', [ {name:'mikey', age:25 }, {name:'joe', age:36}, {name:'steve', age:85}]);
    let fileNames = blocks.getFileNames();
    t.strictEqual(fileNames[0], 'file', "File exists in the system");
    
    bool =  blocks.removeDataFile('file');
    t.equal(bool, true, "removeDataFile should return false because the file was properly removed");
    fileNames = blocks.getFileNames();
    t.strictEqual("", fileNames[0], "there should be no files in the system");

    t.strictEqual(blocks.removeDataFile(""), false, "removeDataFile should return false because the name supplied was empty");
    t.strictEqual(blocks.removeDataFile(null), false, "removeDataFile should return false because the name supplied was null")
    t.end();
});

// Added a data file and duplicate it using the default value and a new name
test('Duplicate a dataset', t => {
    let runtime = new Runtime();
    let blocks = new data(runtime);
    blocks.addDataFile('fileName', [ {name:'mikey', age:25 }, {name:'joe', age:36}, {name:'steve', age:85}]);
    blocks.duplicateDataset({ORIGINAL: 'fileName', NEW: ''});
    t.equal(blocks.getFileNames()[1], 'fileName (1)', "The given file name is empty so the new name is fileName (1)");
    t.equal(blocks._files['fileName'][1].age, blocks._files['fileName (1)'][1].age, "Age data is duplicated properly");
    t.equal(blocks._files['fileName'][0].name, blocks._files['fileName (1)'][0].name, "Name data is duplicated properly");

    blocks.duplicateDataset({ORIGINAL: 'fileName', NEW: 'test'});
    t.equal(blocks.getFileNames()[2], 'test', "File is duplicated and new name is assigned");
    t.equal(blocks._files['fileName'][1].age, blocks._files['test'][1].age, "Age data is duplicated properly");
    t.equal(blocks._files['fileName'][0].name, blocks._files['test'][0].name, "Name data is duplicated properly");
   
    blocks.duplicateDataset({ORIGINAL: "", NEW: 'filefile'});
    t.notEqual(blocks.getFileNames().length, 4, "Should not be equal because the filename supplied is empty");

    blocks.duplicateDataset({ORIGINAL: "NO FILES UPLOADED", NEW: 'filefile'});
    t.notEqual(blocks.getFileNames().length, 4, "Should not be equal because the filename supplied is NO FILES UPLOADED");
    t.end();
});

// Getting the row count of dataset
test('Getting the row count of a dataset', t=> {
    let runtime = new Runtime();
    let blocks = new data(runtime);
    t.equal(blocks.getRowCount({FILENAME: 'fileName'}), 0, "File does not exist in the system");

    blocks.addDataFile('fileName', [ {name:'mikey', age:25 }, {name:'joe', age:36}, {name:'steve', age:85}]);
    t.equal(blocks.getRowCount({FILENAME: 'fileName'}), 3, "File exists in the system");
    t.end();
});

// generateColumnData for menu
test('Testing generateColumnData for menu', t =>{
    let runtime = new Runtime();
    let blocks = new data(runtime);
    t.equal(blocks.generateColumnData()[''][0], 'NO FILES UPLOADED', "No files are uploaded");

    blocks.addDataFile('fileName', [ {name:'mikey', age:25 }, {name:'joe', age:36}, {name:'steve', age:85}]);
    t.equal(blocks.generateColumnData()['fileName'][0], 'name', "File is uploaded and name column is stored properly");
    t.equal(blocks.generateColumnData()['fileName'][1], 'age', "File is uploaded and age column is stored properly");
    t.end();
});

// updateDataFileFromTable called when the file is edited in the file view menu
test('Changing a file in the file view', t =>{
    let runtime = new Runtime();
    let blocks = new data(runtime);
    blocks.addDataFile('fileName', [ {name:'mikey', age:25 }, {name:'joe', age:36}, {name:'steve', age:85}]);
    blocks.updateDataFileFromTable('fileName', 0, 'name', 'Roger');
    t.equal(blocks._files['fileName'][0].name, 'Roger', "String data is modified properly");

    blocks.updateDataFileFromTable('fileName', 0, 'age', 100);
    t.equal(blocks._files['fileName'][0].age, 100, "integer data is modified properly");
    t.end();
})

// Modifying an existing row
test('Modifying an existing row of a dataset', t => {
    runtime = new Runtime();
    blocks = new data(runtime);
    blocks.addDataFile('fileName', [ {name:'mikey', age:25 }, {name:'joe', age:36}, {name:'steve', age:85}]);
     let args = {COLUMN: '[fileName] age', ROW: 1, VALUE: '15', language: 'en-US'};
     blocks.setColumnAtRow(args);
     t.equal(blocks.getColumnAtRow({COLUMN: '[fileName] age', ROW: 1}), 15);
    blocks.setColumnAtRow({COLUMN: '[fileName] name', ROW: 2, VALUE: "Roger"});
    t.equal(blocks.getColumnAtRow({COLUMN: '[fileName] name', ROW: 2}), 'Roger', "string cell is modified properly");
    t.end(); 
});

// Modifying a row, edge cases
test('Modifying a row edge cases', t=>{
    runtime = new Runtime();
    blocks = new data(runtime);
    let args = {COLUMN: '[file] age', ROW: 3, VALUE: '10'};
    let out = blocks.setColumnAtRow(args);
    t.equal(out, '', "file does not exist"); // testing if the file does not exist

    blocks.addDataFile('file', [ {name:'mikey', age:25 }, {name:'joe', age:36}, {name:'steve', age:85}]);
    args = {COLUMN: '[file] age', ROW: 5, VALUE: '100'}
    out = blocks.setColumnAtRow(args);
    t.equal(out, '', "Row does not exist (greater than the max row)");// testing if the row does not exist

    args = {COLUMN: '[file] age', ROW: 0, VALUE: '100' };
    out = blocks.setColumnAtRow(args);
    t.equal(out, '', "row is less than 1 (0)");// testing if the row is less than 1
    t.end();
});

//Adding a row to the data file, checking that the row was added properly
test('Adding a blank row to a dataset', t => {
    runtime = new Runtime();
    blocks = new data(runtime);
    
    t.equal(blocks.addDataFileRow({FILENAME: ''}), '', "File name is empty");
    t.equal(blocks.addDataFileRow({FILENAME: 'NO FILES UPLOADED'}), '', "File name is NO FILES UPLOADED");

    blocks.addDataFile('fileName', [ {name:'mikey', age:25 }, {name:'joe', age:36}, {name:'steve', age:85}]);
    let arg = { FILENAME: 'fileName'};
    blocks.addDataFileRow(arg);
    let args = {COLUMN: '[fileName] age', ROW: 4};
    let result = blocks.getColumnAtRow(args);
    t.strictEqual(0, result, "row is added and 0 is used as a place holder for the int column");
    args = {COLUMN: '[fileName] name', ROW: 4};
    result = blocks.getColumnAtRow(args);
    t.strictEqual('', result, 'row is added and an empty string is used as a place holder for the string column');
    t.end();
});

test('Get column at row edge cases', t => {
    runtime = new Runtime();
    blocks = new data(runtime);
    t.equal(blocks.getColumnAtRow({COLUMN: '[fileName] age', ROW: 1}), "", "No files uploaded");
    blocks.addDataFile('fileName', [ {name:'mikey', age:25 }, {name:'joe', age:36}, {name:'steve', age:85}]);
    t.equal(blocks.getColumnAtRow({COLUMN: '[fileName] age', ROW: 0}), "", "Row is less than 1");
    t.equal(blocks.getColumnAtRow({COLUMN: '[fileName] age', ROW: 5}), "", "Row is greater than the size of the data set");
    t.end();
});

test('Adding an empty dataset', t => {
    runtime = new Runtime();
    blocks = new data(runtime);
    blocks.createEmptyDataset({NAME: 'test'});
    t.equal(blocks.getFileNames()[0], 'test', 'empty dataset created and name added to list of file names');

    blocks.createEmptyDataset({NAME: 'test'});
    t.equal(blocks.getFileNames()[1], 'test (1)', 'empty dataset created and given a different name than the first');
    t.end();
});

test('Adding a column to an existing data set', t=>{
    runtime = new Runtime();
    blocks = new data(runtime);
    t.equal(blocks.addDataFileColumn({TYPE: 'number', NAME: 'column', FILENAME: ''}), '', 'File name is empty');
    t.equal(blocks.addDataFileColumn({TYPE: 'number', NAME: 'column', FILENAME: 'NO FILES UPLOADED'}), '', 'File name is NO FILES UPLOADED');

    blocks.addDataFile('fileName', [ {name:'mikey', age:25 }, {name:'joe', age:36}, {name:'steve', age:85}]);
    t.equal(blocks.addDataFileColumn({TYPE: 'fake', NAME: 'column', FILENAME: 'fileName'}), '', 'Type is not word or number');//need to change this to be text later
    t.equal(blocks.addDataFileColumn({TYPE: 'number', NAME: 'age', FILENAME: 'fileName'}), '', 'Column already exists');
    
    blocks.addDataFileColumn({TYPE: 'word', NAME: 'column', FILENAME: 'fileName'});
    t.equal(blocks.getColumnAtRow({COLUMN: '[fileName] column', ROW: 1}), '', "word column added properly to an already populated data set");
    blocks.addDataFileColumn({TYPE: 'number', NAME: 'num', FILENAME: 'fileName'});
    t.equal(blocks.getColumnAtRow({COLUMN: '[fileName] num', ROW: 3}), 0, "number column added properly to an already populated data set");

    blocks.createEmptyDataset({NAME: 'blank'});
    blocks.addDataFileColumn({TYPE: 'word', NAME: 'name', FILENAME: 'blank'});
    t.equal(blocks.getColumnAtRow({COLUMN: '[blank] name', ROW: 1}), '', 'Adding a word column to an empty dataset');
    blocks.createEmptyDataset({NAME: 'test'});
    blocks.addDataFileColumn({TYPE: 'number', NAME: 'age', FILENAME: 'test'});
    t.equal(blocks.getColumnAtRow({COLUMN: '[test] age', ROW: 1}), 0, 'Adding a number column to an empty dataset');
    t.end();
});

test('Generate file display name', t =>{
    runtime = new Runtime();
    blocks = new data(runtime);
    t.equal(blocks.generateFileDisplayName('fileName'), 'fileName', 'No files are uploaded so original is returned');
    blocks.addDataFile('fileName', [ {name:'mikey', age:25 }, {name:'joe', age:36}, {name:'steve', age:85}]);
    blocks.addDataFile('fileName', [ {name:'mikey', age:25 }, {name:'joe', age:36}, {name:'steve', age:85}]);
    t.equal(blocks.generateFileDisplayName('fileName'), 'fileName (2)', '2 files already loaded with the same name so should return fileName (2)');
    t.end();
});

test('Get Row', t => {
    runtime = new Runtime();
    blocks = new data(runtime);
    t.equal(blocks.getRow('fileName', 1), null, 'no files uploaded');
    blocks.addDataFile('fileName', [ {name:'mikey', age:25 }, {name:'joe', age:36}, {name:'steve', age:85}]);
    let out = blocks.getRow('fileName', 1);
    t.equal(out.name, 'mikey', 'File uploaded, should return the first row');
    t.equal(out.age, 25, 'file uploaded should return first row');
    t.end();
});

test('Get file name', t => {
    runtime = new Runtime();
    blocks = new data(runtime);
    blocks.addDataFile('fileName', [ {name:'mikey', age:25 }, {name:'joe', age:36}, {name:'steve', age:85}]);
    t.equal(blocks.getFilename({}, {}, {text: 'fileName'}), 'fileName', 'returning the blocks text data');
    t.end();
});

test('Get file names array for file viewer', t=> {
    runtime = new Runtime();
    blocks = new data(runtime);
    blocks.createEmptyDataset({NAME: 'fileName'});
    blocks.createEmptyDataset({NAME: 'fileName'});
    blocks.createEmptyDataset({NAME: 'test'});
    let out = blocks.getDataFileNames();
    t.equal(out[0].tag, 'fileName', 'Tag on object matches fileName');
    t.equal(out[1].tag, 'fileName (1)', 'Tag on object matches fileName (1)');
    t.equal(out[2].tag, 'test', 'Tag on object matches test');
    t.end();
});