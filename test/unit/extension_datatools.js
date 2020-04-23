
const test = require('tap').test;
const data = require('../../src/extensions/data_tools/index.js');
const Runtime = require('../../src/engine/runtime');
const dataHelper = require('../../src/extensions/data_tools/data-function-helper')

const dataset = [ {name:'mikey', age:25 }, {name:'joe', age:36}, {name:'steve', age:85}];
const fileName = "fileName";

const util = {
    thread:{
        topBlock: {
          
        },
        peekStack(){
           return this.topBlock.id;     
        }
    },
    target: {
        blocks: {
            _blocks: {
                
            }
        }
    },
    startFunctionBranch(){
        util.functionBranchReached = true;
        return;
    },
    functionBranchReached: false
}



test('find containing loop block', t => {
    let blocks = new dataHelper();
    try{
        blocks._findContainingLoopBlock(util);
    }
    catch(ReferenceError)//catching a reference error to account for the fact that the window.alert is not available without a browser
    {
        t.ok(true);
    }
    util.thread.topBlock = {
        id: 'setMap',
        opcode: 'datatools_setMapResult',
        parent: 'dataFunction',
    };
    util.target.blocks._blocks = {setMap: {
        id: 'setMap',
        opcode: 'datatools_setMapResult',
        parent: 'dataFunction',
        }
        ,
        dataFunction: {
            id: 'dataFunction',
            opcode: 'datatools_executeDataFunction',
            parent: null
        }
    }; 
    t.equal(blocks._findContainingLoopBlock(util, false), "dataFunction");
    t.equal(blocks._findContainingLoopBlock(util, true), "dataFunction");

    util.target.blocks._blocks = {setMap: {
        id: 'setMap',
        opcode: 'datatools_setMapResult',
        parent: 'dataFunction',
        }
        ,
        dataFunction: {
            id: 'dataFunction',
            opcode: 'datatools_executeDataFunction',
            parent: 'dataFunction2'
        },
        dataFunction2: {
            id: 'dataFunction2',
            opcode: 'datatools_executeDataFunction',
            parent: null
        }
    }; 
    t.equal(blocks._findContainingLoopBlock(util, false), "dataFunction");
    t.end();
});

test('check opcode', t => {
    let blocks = new dataHelper();
    t.equal(blocks._checkOpcode('datatools_executeDataFunction'), true, 'checking if the opcode is equal to executeDataFunction');
    t.equal(blocks._checkOpcode('datatools_saveFunctionData', true), true, 'checking if the opcode is equal to executeDataFunctionAndSave');
    t.equal(blocks._checkOpcode('setMapResult'), false, 'checking when opcode is setMapResult');
    t.end();
});

test('get outermost block', t =>{
    let blocks = new dataHelper();
    util.thread.topBlock = {
        id: 'dataFunction',
        opcode: 'datatools_executeDataFunction',
        parent: null,
    };
    util.target.blocks._blocks = {setMap: {
        id: 'setMap',
        opcode: 'datatools_setMapResult',
        parent: 'dataFunction',
        inputs: {},
        }
        ,
        dataFunction: {
            id: 'dataFunction',
            opcode: 'datatools_executeDataFunction',
            parent: null
        }
    }; 
    t.equal(blocks._getOutermostBlock(util), 'dataFunction', 'Case where the executing block is executeDataFunction');

    util.thread.topBlock = {
        id: 'sayFor',
        opcode: 'looks_sayforsecs',
        parent: null,
        inputs: {
            MESSAGE: {block: 'dataFunction'}
        }
    };
    util.target.blocks._blocks = {setMap: {
        id: 'setMap',
        opcode: 'datatools_setMapResult',
        parent: 'dataFunction',
        }
        ,
        dataFunction: {
            id: 'dataFunction',
            opcode: 'datatools_executeDataFunction',
            parent: null
        },
        sayFor : {
            id: 'sayFor',
            opcode: 'looks_sayforsecs',
            parent: null,
            inputs: {
                MESSAGE: {block: 'dataFunction'}
            }
        }
    }; 
    t.equal(blocks._getOutermostBlock(util), 'dataFunction', 'Case where map is inside of a say block');
    t.end();
});

test('creating depth map for data function helper', t=>{
    let blocks = new dataHelper();
    util.thread.topBlock = {
        id: 'dataFunction',
        opcode: 'datatools_executeDataFunction',
        parent: null,
    };
    util.target.blocks._blocks = {setMap: {
        id: 'setMap',
        opcode: 'datatools_setMapResult',
        parent: 'dataFunction',
        inputs: {},
        }
        ,
        dataFunction: {
            id: 'dataFunction',
            opcode: 'datatools_executeDataFunction',
            parent: null,
            inputs: {
                NAME: {
                    block: 'setMap'
                }
            }
        }
    }; 

    blocks._generateFunctionBlockDepthMap(util);
    t.equal(blocks._depthMaps[util.thread.topBlock][0], 'dataFunction', 'Case when there is only one map block');
    t.equal(blocks._depths[util.thread.topBlock], 0, 'case when there is only one map block');

    util.target.blocks._blocks = {
            setMap: {
            id: 'setMap',
            opcode: 'datatools_setMapResult',
            parent: 'dataFunction',
            inputs: {},
            }
            ,
            dataFunction: {
                id: 'dataFunction',
                opcode: 'datatools_executeDataFunction',
                parent: null,
                inputs: {
                    NAME: {
                        block: 'dataFunction2'
                    }
                }
            },
            dataFunction2: {
                id: 'dataFunction2',
                opcode: 'datatools_executeDataFunction',
                parent: null,
                inputs: {
                    NAME: {
                        block: 'setMap'
                    }
                }
            }
    };
    blocks._generateFunctionBlockDepthMap(util);
    t.equal(blocks.getID(util.thread.topBlock), 'dataFunction2', 'Case when there is two nested map blocks');
    t.equal(blocks._depths[util.thread.topBlock], 1, 'case when there is two nested map blocks');
    t.end();
});

test('handle error', t =>{
    let blocks = new dataHelper();
    try {
        blocks._handleError('', {});
    }
    catch(ReferenceError)//catching a reference error to account for the fact that the window.alert is not available without a browser
    {
       t.ok(true, 'Caught a reference error on alert'); 
    }
    t.end();
});

test('generate new data set', t=> {
    let blocks = new dataHelper();
    let out = blocks._generateNewDataSet([{age: 15}, {age: 200}, {age: undefined}, {age: 0}]);
    t.equal(out[0].age, 15, 'checking that number got assigned properly');
    t.equal(out[2].age, 0, 'checking that the undefined value got set to 0');
    t.equal(out[3].age, 0, 'checking that 0 got set properly');

    out = blocks._generateNewDataSet([{name: 'phillip'}, {name: undefined}, {name: null}, {name: ''}]);
    t.equal(out[0].name, 'phillip', 'checking that name got assigned properly');
    t.equal(out[1].name, '', 'checking that the undefined value got set to empty string');
    t.equal(out[2].name, '', 'checking that null value got set properly');
    t.equal(out[3].name, '', 'checking that an empty string value stays the same');
    t.end();
});

test('setting the map result', t=>{
    let blocks = new dataHelper();
    util.thread.topBlock = {
        id: 'setMap',
        opcode: 'datatools_setMapResult',
        parent: 'dataFunction',
    };
    util.target.blocks._blocks = {setMap: {
        id: 'setMap',
        opcode: 'datatools_setMapResult',
        parent: null,
        }
        ,
        dataFunction: {
            id: 'dataFunction',
            opcode: 'datatools_executeDataFunction',
            parent: null
        }
    };
    blocks._errors[util.thread.topBlock] = true; 
    let id = blocks._findContainingLoopBlock(util, false);
    blocks._loopCounters[id] = 1;
   
    blocks.setMapResult({COLUMN: 'age', VALUE: 15}, util);
    t.same(blocks._errors[util.thread.topBlock], null, 'checking that the data for the block gets deleted');

    util.target.blocks._blocks = {setMap: {
        id: 'setMap',
        opcode: 'datatools_setMapResult',
        parent: 'dataFunction',
        }
        ,
        dataFunction: {
            id: 'dataFunction',
            opcode: 'datatools_executeDataFunction',
            parent: null
        }
    };
    blocks._errors[util.thread.topBlock] = true;
    blocks.setMapResult({COLUMN: 'age', VALUE: 15}, util);
    t.equal(blocks._loopCounters[id], 1, 'checking that the loop counter value is not deleted when there is an error');
    blocks._errors[util.thread.topBlock] = false;    

    id = blocks._findContainingLoopBlock(util, false);
    blocks._loopCounters[id] = 1;
    blocks.setMapResult({COLUMN: 'age', VALUE: 15}, util);
    blocks.setMapResult({COLUMN: 'name', VALUE: 'Mickey'}, util);
    blocks._loopCounters[id] += 1;
    blocks.setMapResult({COLUMN: 'name', VALUE: 'Daffy Duck'}, util);
    blocks.setMapResult({COLUMN: 'age', VALUE: 55}, util);
    t.equal(blocks._results[id][0]['age'], 15, 'testing that the age value got set properly in the results array');
    t.equal(blocks._results[id][1]['age'], 55, 'testing that the age value got set properly in the results array');
    t.equal(blocks._results[id][0]['name'], 'Mickey', 'testing that the name value got set properly in the results array');
    t.equal(blocks._results[id][1]['name'], 'Daffy Duck', 'testing that the name value got set properly in the results array');
    t.end();
});

test('delete working data', t=>{
    let blocks = new dataHelper();
    util.thread.topBlock = {
        id: 'setMap',
        opcode: 'datatools_setMapResult',
        parent: 'dataFunction',
    };
    util.target.blocks._blocks = {setMap: {
        id: 'setMap',
        opcode: 'datatools_setMapResult',
        parent: 'dataFunction',
        }
        ,
        dataFunction: {
            id: 'dataFunction',
            opcode: 'datatools_executeDataFunction',
            parent: null
        }
    };
    let id = blocks._findContainingLoopBlock(util);
    blocks._loopCounters[id] = 1;
    blocks._currentRowValues[id] = 15;
    blocks._results[id]  = [{'age': 15}];
    blocks._depthMaps[util.thread.topBlock] = ['setMap'];
    blocks._depths[util.thread.topBlock] = 0;
    blocks._errors[util.thread.topBlock] = true;
    blocks._generatedData[util.thread.topBlock] = {fileName: 'map: fileName'};
    blocks._deleteWorkingData(id, util.thread.topBlock);
    t.same(blocks._loopCounters[id], null, 'loop counter deleted');
    t.same(blocks._currentRowValues[id], null, 'current row values deleted');
    t.same(blocks._results[id], null, 'results deleted');
    t.same(blocks._depthMaps[util.thread.topBlock], null, 'depth map deleted');
    t.same(blocks._depths[util.thread.topBlock], null, 'depths deleted');
    t.same(blocks._errors[util.thread.topBlock], null, 'errors deleted');
    t.same(blocks._generatedData[util.thread.topBlock], null, 'generated data deleted');
    

    blocks._loopCounters[id] = 1;
    blocks._currentRowValues[id] = 15;
    blocks._results[id]  = [{'age': 15}];
    blocks._deleteWorkingData(id, null);
    t.same(blocks._loopCounters[id], null, 'loop counter deleted');
    t.same(blocks._currentRowValues[id], null, 'current row values deleted');
    t.same(blocks._results[id], null, 'results deleted');
    t.end();
});

test('get current row', t=>{
    let runtime = new Runtime();
    let blocks = new data(runtime);
    util.thread.topBlock = {
        id: 'dataFunction',
        opcode: 'datatools_executeDataFunction',
        parent: null,
    };
    util.target.blocks._blocks = {setMap: {
        id: 'setMap',
        opcode: 'datatools_setMapResult',
        parent: 'dataFunction',
        inputs: {},
        }
        ,
        dataFunction: {
            id: 'dataFunction',
            opcode: 'datatools_executeDataFunction',
            parent: null,
            inputs: {
                NAME: {
                    block: 'setMap'
                }
            }
        }
    }; 
    blocks._helper._currentRowValues['dataFunction'] = {name: undefined};
    try{
        blocks.getCurrentRow({COLUMN: 'name'}, util);
    }
    catch(ReferenceError)
    {
        t.ok(true, 'checking when there is no data loaded into the currentRowValues array');
    }
    blocks._helper._currentRowValues['dataFunction']= {name: 'phillip'};
    t.equal(blocks.getCurrentRow({COLUMN: 'name'}, util), 'phillip', 'Checking that the correct value is retrieved and the system does not error out');
    t.end();
});

test('save function data', t=>{
    let runtime = new Runtime();
    let blocks = new data(runtime);
    util.thread.topBlock = {
        id: 'dataFunction',
        opcode: 'datatools_executeDataFunction',
        parent: null,
    };
    util.target.blocks._blocks = {setMap: {
        id: 'setMap',
        opcode: 'datatools_setMapResult',
        parent: 'dataFunction',
        inputs: {},
        }
        ,
        dataFunction: {
            id: 'dataFunction',
            opcode: 'datatools_executeDataFunction',
            parent: null,
            inputs: {
                NAME: {
                    block: 'setMap'
                }
            }
        }
    }; 
    blocks.saveFunctionData({FUNCTION: 'NO FILES UPLOADED', NAME: 'fileName'}, util);
    t.same(blocks._files['fileName'], null);

    blocks.addDataFile('file', [ {name:'mikey', age:25 }, {name:'joe', age:36}, {name:'steve', age:85}]);
    t.equal(blocks.saveFunctionData({FUNCTION: 'file', NAME: 'fileName'}, util), 'fileName', 'checking that the new name is returned');
    t.same(blocks._files['file'], null);
    t.equal(blocks._files['fileName'][1].age, 36, 'checking that the data is saved properly');
    blocks.addDataFile('file', [ {name:'mikey', age:25 }, {name:'joe', age:36}, {name:'steve', age:85}]);
    t.equal(blocks.saveFunctionData({FUNCTION: 'file', NAME: 'fileName'}, util), 'fileName (1)', 'checking that the new name is returned');

    blocks.addDataFile('test', [ {name:'mikey', age:25 }, {name:'joe', age:36}, {name:'steve', age:85}]);
    blocks._helper._generatedData[util.thread.topBlock] = {test: 'map: fileName'};
    t.equal(blocks.saveFunctionData({FUNCTION:'test', NAME: 'testtest'}, util), 'testtest');
    
    
    blocks.addDataFile('file', [ {name:'mikey', age:25 }, {name:'joe', age:36}, {name:'steve', age:85}]);
    blocks._helper._generatedData[util.thread.topBlock] = {file: 'map: fileName'};
    blocks._helper._savedDatasets[util.thread.topBlock] = {file: 'file'};
    t.equal(blocks.saveFunctionData({FUNCTION:'file', NAME: 'file'}, util), 'file');
    t.equal(blocks.saveFunctionData({FUNCTION:'file', NAME: 'filename'}, util), 'filename');

    t.end();
});

test('execute data function', t=>{
    let runtime = new Runtime();
    let blocks = new data(runtime);
    util.thread.topBlock = {
        id: 'dataFunction',
        opcode: 'datatools_executeDataFunction',
        parent: null,
    };
    util.target.blocks._blocks = {setMap: {
        id: 'setMap',
        opcode: 'datatools_setMapResult',
        parent: 'dataFunction',
        inputs: {},
        }
        ,
        dataFunction: {
            id: 'dataFunction',
            opcode: 'datatools_executeDataFunction',
            parent: null,
            inputs: {
                NAME: {
                    block: 'setMap'
                }
            }
        }
    }; 
    try{
        blocks.executeDataFunction({FUNCTION: 'map', NAME: 'NO FILES UPLOADED'}, util);
    }
    catch(ReferenceError)//catching a reference error to account for the fact that the window.alert is not available without a browser
    {
        t.ok(true, 'Testing when no files are uploaded that the system gives an alert to the user');
    }

    blocks.addDataFile('fileName', [ {name:'mikey', age:25 }, {name:'joe', age:36}]);
    blocks._helper._errors[util.thread.topBlock] = true;
    t.equal(blocks.map({FUNCTION: 'map', NAME: 'fileName'}, util), '', 'checking if there is a logged error with the top block it fails gracefully');

    blocks._helper._errors[util.thread.topBlock] = false;
    blocks.executeDataFunction({FUNCTION: 'map', NAME: 'fileName'}, util);
    t.equal(util.functionBranchReached, true, 'checking that the function branch is reached');

    try{
        
        blocks.executeDataFunction({FUNCTION: 'map', NAME: 'fileName'}, util);
    }
    catch(ReferenceError)//catching a reference error to account for the fact that the window.alert is not available without a browser
    {
        t.ok(true, 'checking that the map result must be set');
    }
    blocks.setMapResult({COLUMN: 'name', VALUE: 'mikey'}, util);
    blocks.executeDataFunction({FUNCTION: 'map', NAME: 'fileName'}, util);
    t.equal(blocks._helper._loopCounters['dataFunction'], 2, 'checking that as the map function moves through the loop counter is incremented');
    blocks.setMapResult({COLUMN: 'name', VALUE: 'joe'}, util);
    blocks.executeDataFunction({FUNCTION: 'map', NAME: 'fileName'}, util);
    t.equal(blocks._files['map: fileName'][0].name, 'mikey');
    t.equal(blocks._hiddenFiles[0], 'map: fileName', 'File is not saved so it is added to the array of files that are hidden');

    blocks.executeDataFunction({FUNCTION: 'map', NAME: 'fileName'}, util);
    blocks.setMapResult({COLUMN: 'name', VALUE: 'mikey'}, util);
    blocks.executeDataFunction({FUNCTION: 'map', NAME: 'fileName'}, util);
    blocks.setMapResult({COLUMN: 'name', VALUE: 'mikey'}, util);
    blocks.executeDataFunction({FUNCTION: 'map', NAME: 'fileName', SAVE: true, NEWNAME: 'new map'}, util);
    t.equal(blocks._files['new map'][0].name, 'mikey');
    t.equal(blocks._hiddenFiles.includes('new map'), false);

    blocks._helper._generatedData[util.thread.topBlock] = {fileName: 'map: fileName'};
    t.equal(blocks.executeDataFunction({FUNCTION: 'map', NAME: 'fileName'}, util), 'map: fileName');

    t.end();
});

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
    t.equal(blocks.generateDisplayedBlocks()[0].text, 'fileName', "file block for the new file created properly");
    t.equal(blocks.generateDisplayedBlocks()[0].opcode, 'file_fileName', "file block for the new file created properly");

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
    t.strictEqual("NO FILES UPLOADED", fileNames[0], "there should be no files in the system");

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
    t.equal(blocks.addDataFileColumn({TYPE: 'fake', NAME: 'column', FILENAME: 'fileName'}), '', 'Type is not text or number');//need to change this to be text later
    t.equal(blocks.addDataFileColumn({TYPE: 'number', NAME: 'age', FILENAME: 'fileName'}), '', 'Column already exists');
    
    blocks.addDataFileColumn({TYPE: 'text', NAME: 'column', FILENAME: 'fileName'});
    t.equal(blocks.getColumnAtRow({COLUMN: '[fileName] column', ROW: 1}), '', "text column added properly to an already populated data set");
    blocks.addDataFileColumn({TYPE: 'number', NAME: 'num', FILENAME: 'fileName'});
    t.equal(blocks.getColumnAtRow({COLUMN: '[fileName] num', ROW: 3}), 0, "number column added properly to an already populated data set");

    blocks.createEmptyDataset({NAME: 'blank'});
    blocks.addDataFileColumn({TYPE: 'text', NAME: 'name', FILENAME: 'blank'});
    t.equal(blocks.getColumnAtRow({COLUMN: '[blank] name', ROW: 1}), '', 'Adding a text column to an empty dataset');
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