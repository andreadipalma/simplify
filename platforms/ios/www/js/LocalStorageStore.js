var LocalStorageStore = function() {
    // Memory buffer
    this.memBuffer = { acceleration: [], position: [], orientation: [] };
    // Number of samples managed in memory before storing on the local storage
    this.timeWindowHours = 1000;
    var self = this;

    this.count = function(type) {
        var data = JSON.parse(window.localStorage.getItem(type));
        var memSampleCount =  (this.memBuffer[type].length < this.timeWindowHours) ? this.memBuffer[type].length : 0;
     
        return (data ? data.length : 0) + memSampleCount;
    };

    this.getStoredSamples = function(type) {
        return JSON.parse(window.localStorage.getItem(type));
    };
    
    this.findByTimeRange = function(type) {
        var data = JSON.parse(window.localStorage.getItem(type));
        var results = data.filter(function(element) {
                                  var timestamp;
                                  switch (type) {
                                  case ("acceleration"):
                                    timestamp = element.timestamp;
                                  break;
                                  case ("position"):
                                    timestamp = element.timestamp;
                                  break;
                                  case ("orientation"):
                                    //timestamp = element.timestamp;
                                  break;
                                  }
                                  return checkMyDateWithinRange(timestamp) === true;
                                  });
        return results;
    };
    
    this.flush = function(type, data) {
         //callLater(function() {
                   // Store in memory
                   self.memBuffer[type].push(data);
                   if (self.memBuffer[type].length >= self.timeWindowHours) {
                        // Store in the local storage
                        var oldData = JSON.parse(window.localStorage.getItem(type));
                        if (oldData !== null) {
                            var newData = oldData.concat(self.memBuffer[type]);
                            window.localStorage.setItem(type, JSON.stringify(newData));
                                          } else {
                            window.localStorage.setItem(type, JSON.stringify(self.memBuffer[type]));
                        }
                        self.memBuffer[type].length = 0;
                   }
        //        }, data);
    };
    
    this.clearAll = function() {
        callLater(function() {
                  // Clear local storage
                    self.memBuffer.acceleration.length=0;
                    self.memBuffer.position.length=0;
                    self.memBuffer.orientation.length=0;
                    // Store in the local storage
                    window.localStorage.removeItem("acceleration");
                    window.localStorage.removeItem("position");
                    window.localStorage.removeItem("orientation");
                  });
    };

    // Used to simulate async calls. This is done to provide a consistent interface with stores (like WebSqlStore)
    // that use async data access APIs
    var callLater = function(callback, data) {
        if (callback) {
            setTimeout(function() {
                       callback(data);
                       });
        }
    };
        
    var checkMyDateWithinRange = function(myDate) {
            var startDate = new Date();
            var endDate = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), startDate.getHours() - this.timeWindowHours, startDate.getMinutes(), startDate.getSeconds(), startDate.getMilliseconds());

            if (startDate < myDate && myDate < endDate) {
                console.log("ok");
                return true;
            }
            console.log("false");
            return false;
    };
};