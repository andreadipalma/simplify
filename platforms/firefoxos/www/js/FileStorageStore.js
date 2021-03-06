var FileStorageStore = function() {
    // Memory buffer
    this.memBuffer = { acceleration: [], position: [], orientation: [] };
    this.countSamples = { acceleration:0, position:0, orientation:0 };
    // Number of samples managed in memory before storing on the file storage
    this.cachedSamples = 1000;
    // Number of bytes read from the sample data as preview
    this.chunkData = 10000;
    // Max number of samples to persist locally before transferring to the server
    this.maxSampleChunk = 5000;
    this.fileURI = null;
    this.callback = null;
    this.type = null;
    var serverURI = encodeURI('https://demo-project-andreadp.c9.io/api/upload');
    var self = this;
    
    // To call when the device is ready
    this.init = function() {
        window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
        window.requestFileSystem(window.PERSISTENT, 10*1024*1024, onInitFs, errorHandler);
    };
    
    // Initialize the filesystem and assign to self.fs for reuse
    var onInitFs = function(fs) {
        self.fs = fs;
    };

    this.count = function(type) {
        return (this.countSamples[type]);
    };

    this.getStoredSamples = function(type) {
        //Simulate async call to avoid blocking the thread during writing samples
        var d = $.Deferred();
        
        var gotFileEntry = function(fileEntry) {
            // Get a File object representing the file,
            // then use FileReader to read its contents.
            
            // Set the fileURI for transfering the file if requested by the user.
            if (self.fileURI === null ) {
                self.fileURI = encodeURI(fileEntry.nativeURL);
                Utils.showAlert('fileURI = ' + fileEntry.nativeURL + ' - ' + JSON.stringify(fileEntry));
            }
            fileEntry.file(gotFile, errorHandler);
        };
        
        var gotFile = function(file) {
            var reader = new FileReader();
            Utils.showAlert('Entered gotFile');
            var buf = '';
            
            reader.onloadend = function(e) {
                
                Utils.showAlert('Entered onloadend');
                
                var results = [];
                buf += e.target.result.toString();
                
                // when data is read, stash it in a string buffer
                results = pump(buf);
                Utils.showAlert('Results length:'+ results.length);
                
                // set the count for type
                self.countSamples[self.type] = results.length;
                //Utils.showAlert('results.length: '+ results.length);
                
                // then process the buffer
                d.resolve(results);
                Utils.showAlert('Completed onloadend');
            };
            
            var pump = function($buf) {
                Utils.showAlert('Entered pump');
                
                var pos;
                var resultList = [];
                
                while ((pos = $buf.indexOf('\n')) >= 0) { // keep going while there's a newline somewhere in the buffer
                    
                    if (pos === 0) { // if there's more than one newline in a row, the buffer will now start with a newline
                        $buf = $buf.slice(1); // discard it
                        continue; // so that the next iteration will start with data
                    }
                    var jsonObj = process($buf.slice(0,pos)); // hand off the line
                    if (jsonObj !== null) {
                        resultList.push(jsonObj);
                    }
                    
                    $buf = $buf.slice(pos+1); // and slice the processed data off the buffer
                }
                Utils.showAlert('Completed pump');
                
                return resultList;
            };
            
            var process = function(line) {
                // here's where we do something with a line
                var ret = null;
                if (line[line.length-1] == '\r') {
                    line=line.substr(0,line.length-1); // discard CR (0x0D)
                }
                
                if (line.length > 0) { // ignore empty lines
                    var obj = JSON.parse(line); // parse the JSON
                    console.log(obj);
                    ret = obj;
                }
                return ret;
            };
            
            var startPos = (file.size-self.chunkData > 0) ? file.size-self.chunkData : 0;
            //alert('File size:' + file.size + ' Start pos:'+startPos);
            file.slice(startPos, file.size);
            reader.readAsText(file);
            Utils.showAlert('Completed gotFile');
        };
        
        var _errorHandler = function() {
            // then process the buffer
            d.reject();
            Utils.showAlert('Complete _errorHandler');
        };
        
        setTimeout(function() {
                   var fileName = type + ".data.log";
                   //self.callback = callback;
                   self.type = type;
                   self.fs.root.getFile(fileName, {create: false}, gotFileEntry, _errorHandler);
                   }, 0);
        
        return d;
    };

    
    this.clearAll = function() {
        async(function() {
                  // Clear local storage
                    self.memBuffer.acceleration.length=0;
                    self.memBuffer.position.length=0;
                    self.memBuffer.orientation.length=0;
                    // Store in the local storage
                    self.fs.root.getFile("acceleration.data.log", {create: false}, removeFileJSON, errorHandler);
                    self.fs.root.getFile("orientation.data.log", {create: false}, removeFileJSON, errorHandler);
                    self.fs.root.getFile("position.data.log", {create: false}, removeFileJSON, errorHandler);
                    this.countSamples.acceleration = 0;
                    this.countSamples.orientation = 0;
                    this.countSamples.position = 0;
                  });
    };
    
    this.compress = function(resultList) {
        var d = $.Deferred();
        var _self = this;
                          
        var createZipFile = function(zipFile, fileEntry) {
                     fileEntry.createWriter(function(fileWriter) {
                                                 
                                fileWriter.onwriteend = function(e) {
                                console.log('Write completed.');
                                Utils.showAlert('Completed compressed file');
                                d.resolve();
                                //alert('Write of file completed');
                                };
                                         
                                fileWriter.onerror = function(e) {
                                console.log('Write failed: ' + e.toString());
                                d.reject(e);
                                };
                
                                // Create a new Blob and write it to log.txt.
                                fileWriter.write(zipFile);
                     });
        };
        
        Utils.showAlert('Compress method started');
        
        var zip = new JSZip();
        var n = self.fileURI.lastIndexOf("/", self.fileURI.length);
        var fileName = self.fileURI.slice(n+1, self.fileURI.length);
        zip.file(fileName + ".zip", JSON.stringify(resultList), {type:"blob", binary: false, compression:  "DEFLATE"});
        Utils.showAlert('Result list to be compressed: ' + resultList.length);
        var blob = zip.generate();
        Utils.showAlert('Completed file compression');
        
        try {
               self.fs.root.getFile(fileName + ".zip", {create: true}, createZipFile.bind(null, blob), errorHandler);
        } catch (ex) {
               console.log("Error "+ex);
               throw (ex);
        }
        return d.promise();
    };
    
    this.transfer = function() {

            Utils.showAlert('Transfer method started');
            var d = $.Deferred();
            var _self = this;
        
            var win = function(r) {
                console.log("Code = " + r.responseCode);
                console.log("Response = " + r.response);
                console.log("Sent = " + r.bytesSent);
                d.resolve();
                Utils.showAlert("Response = " + r.response);
            };
        
            var fail = function(error) {
                Utils.showAlert("An error has occurred: Code = " + error.code + " source: " + error.source);
                console.log("upload error source " + error.source);
                console.log("upload error target " + error.target);
                d.reject();
            };

            var options = new FileUploadOptions();
            options.fileKey="file";
            //Add a timestamp to the fileURI
            options.fileName=self.fileURI.substr(self.fileURI.lastIndexOf('/')+1) + "." + Utils.dateNow();
            options.mimeType="text/plain";
        
            var params = { user: "adp", timestamp: "" };
        
            options.params = params;
            options.chunkedMode = false;
            options.headers = {
                Connection: "close"
            };

            Utils.showAlert('FileURI: ' + self.fileURI);

            var ft = new FileTransfer();
            //var callBackOk = ((onComplete !== null) && (onComplete !== 'undefined')) ? onComplete : win;
            try {
                ft.upload(self.fileURI, serverURI, win, fail, options, true);
            } catch (ex) {
                console.log("Tranfer error: "+ex);
            }
            Utils.showAlert('Transfer method completed');
            return d.promise();
    };


    // Removes the file
    var removeFileJSON = function(fileEntry) {
        fileEntry.remove(function() {
                         console.log('File removed.');
                         }, errorHandler);
    };
    
    this.flush = function(type, data) {
        //Try to load the persisted file to count the former samples
        if (self.countSamples[type] === 0) {
            self.getStoredSamples(self.type).done(function (dataList) {
                                                 var countSamples = dataList.length;
                                                 self.countSamples[type] += countSamples;
                                                 });
        }
        
        // Store in memory
        self.memBuffer[type].push(data);
        this.countSamples[type]++;
        
        if (self.memBuffer[type].length >= self.cachedSamples) {
            var fileName = type + '.data.log';
            var self_type = type;
            var toTransfer = (this.countSamples[type] >= this.maxSampleChunk) ? true : false;
            self.fs.root.getFile(fileName, {create: false}, appendToFileJSON.bind(null, type, toTransfer), openExistingErrorHandler.bind(null, type));
        }
    };
    
    var appendToFileJSON = function(type, toTransfer, fileEntry) {
        // Create a FileWriter object for our FileEntry (log.txt).
        if (self.fileURI === null ) {
            self.fileURI = encodeURI(fileEntry.nativeURL);
            Utils.showAlert('fileURI = ' + fileEntry.nativeURL + ' - ' + JSON.stringify(fileEntry));
        }

        fileEntry.createWriter(function(fileWriter) {
                               
                               fileWriter.onwriteend = function(e) {
                               console.log('Write completed.');
                               //alert('Write of file completed');
                               };
                               
                               fileWriter.onerror = function(e) {
                               console.log('Write failed: ' + e.toString());
                               };
                               
                               // Start write position at EOF.
                               fileWriter.seek(fileWriter.length);
                               
                               // Create a new Blob and write it to log.txt.
                               var buf = '';
                               for (var i = 0; i < self.memBuffer[type].length; i++) {
                                    buf += JSON.stringify(self.memBuffer[type][i]) + "\n";
                               
                               }
                               var blob = new Blob([buf], {type: 'text/plain'});
                               fileWriter.write(blob);
                               self.memBuffer[type].length = 0;
                               if (toTransfer === true) {
                                    //self.compress().then(self.storageManager.transfer).done(self.clearAll());
                                    self.transfer().done(self.clearAll());
                               }
                            }, errorHandler);
    };
    
    var openExistingErrorHandler = function(type, e) {
        var fileName = type + ".data.log";
        self.fs.root.getFile(fileName, {create: true}, appendToFileJSON.bind(null, type), errorHandler.bind(null, type));
    };
    
    var errorHandler = function(e) {
        var msg = '';
        
        switch (e.code) {
            case FileError.QUOTA_EXCEEDED_ERR:
                msg = 'QUOTA_EXCEEDED_ERR';
                break;
            case FileError.NOT_FOUND_ERR:
                msg = 'NOT_FOUND_ERR';
                break;
            case FileError.SECURITY_ERR:
                msg = 'SECURITY_ERR';
                break;
            case FileError.INVALID_MODIFICATION_ERR:
                msg = 'INVALID_MODIFICATION_ERR';
                break;
            case FileError.INVALID_STATE_ERR:
                msg = 'INVALID_STATE_ERR';
                break;
            default:
                msg = 'Unknown Error';
                break;
        }
        
        console.log('Error: ' + msg);
    };

    
    
    // Used to simulate async calls. This is done to provide a consistent interface with stores (like WebSqlStore)
    // that use async data access APIs
    var async = function(callback, data) {
        if (callback) {
            setTimeout(function() {
                       callback(data);
                       }, 0);
        }
    };
};