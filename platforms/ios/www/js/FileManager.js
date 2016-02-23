var FileManager = {
toTransfer: false,
self:this,

errorMessage: function(e) {
    
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
    return msg;
},

checkExist: function (name) {
    var deferred = $.Deferred();
    
    var fail = function (error) {
        deferred.reject(function (){self.errorMessage(error);});
    };
    
    var gotFileSystem = function (fileSystem) {
        console.log("File to be checke:" + name);
        fileSystem.root.getFile(name, { create: false, exclusive: false }, gotFileEntry, fail);
    };
    
    var gotFileEntry = function (fileEntry) {
        deferred.resolve(fileEntry);
    };
    
    window.requestFileSystem(window.LocalFileSystem.PERSISTENT,10*1024*1024, gotFileSystem, fail);
    return deferred.promise();
},
    
write: function (toCreate, name, data) {
    var deferred = $.Deferred();
    
    var fail = function (error) {
        deferred.reject(function (){self.errorMessage(error);});
    };
    
    var gotFileSystem = function (fileSystem) {
        fileSystem.root.getFile(name, { create: toCreate, exclusive: false }, gotFileEntry, fail);
    };
    
    var gotFileEntry = function (fileEntry) {
        fileEntry.createWriter(gotFileWriter, fail);
    };
    
    var gotFileWriter = function (writer) {
        
        writer.onwriteend = function(e) {
            console.log('Write completed.');
            deferred.resolve(writer);
            //alert('Write of file completed');
        };
        
        writer.onerror = fail;

        // Start write position at EOF.
        writer.seek(writer.length);
        
        // Create a new Blob and write it to log.txt.
        var buf = '';
        for (var i = 0; i < data.length; i++) {
            buf += JSON.stringify(data[i]) + "\n";
            
        }
        var blob = new Blob([buf], {type: 'text/plain'});
        writer.write(blob);
        //data.length = 0;
        //deferred.resolve(blob);
    };
    
    window.requestFileSystem(window.LocalFileSystem.PERSISTENT, data.length || 0, gotFileSystem, fail);
    return deferred.promise();
},


create: function (name, data) {
    var deferred = $.Deferred();
    
    var fail = function (error) {
        deferred.reject(function (){self.errorMessage(error);});
    };
    
    this.write(true, name, data)
        .done(function (handler) {
              console.log('Create completed.');
              deferred.resolve(handler);
                          })
        .fail(deferred.reject());
    
    return deferred.promise();
},
    
append: function (name, data) {
    var deferred = $.Deferred();
    
    var fail = function (error) {
        deferred.reject(function (){self.errorMessage(error);});
    };
    
    this.write(false, name, data)
        .done(function (handler) {
              console.log('Append completed.');
              deferred.resolve(handler);
              })
        .fail(deferred.reject());
    
    return deferred.promise();
},
    
load: function (name) {
    var deferred = $.Deferred();
    
    var fail = function (error) {
        deferred.reject(function (){self.errorMessage(error);});
    };
    
    var gotFileSystem = function (fileSystem) {
        fileSystem.root.getFile(name, { create: false, exclusive: false }, gotFileEntry, fail);
    };
    
    var gotFileEntry = function (fileEntry) {
        fileEntry.file(gotFile, fail);
    };
    
    var gotFileWriter = function (writer) {
        reader = new FileReader();
        reader.onloadend = function (evt) {
            data = evt.target.result;
            deferred.resolve(data);
        };
        
        reader.readAsText(file);
    };
    
    window.requestFileSystem(window.LocalFileSystem.PERSISTENT, data.length || 0, gotFileSystem, fail);
    return deferred.promise();
},
    
delete: function (name) {
        var deferred = $.Deferred();
        
        var fail = function (error) {
            console.log(self.errorMessage(error));
            deferred.reject(function (){self.errorMessage(error);});
        };
    
        var gotFileSystem = function (fileSystem) {
            fileSystem.root.getFile(name, { create: false, exclusive: true }, gotFileEntry, fail);
        };
        
        var gotFileEntry = function (fileEntry) {
            console.log("To be removed correctly");
            fileEntry.remove();
            deferred.resolve();
        };
        
        window.requestFileSystem(window.LocalFileSystem.PERSISTENT, 10*1024*1024, gotFileSystem, fail);
        return deferred.promise();
    }
};