var Utils = {

    debug: false,
    
    formatTime: function(timestamp) {
        // create a new javascript Date object based on the timestamp
        // multiplied by 1000 so that the argument is in milliseconds, not seconds
        var date = new Date(timestamp);
        // hours part from the timestamp
        var hours = date.getHours();
        // minutes part from the timestamp
        var minutes = "0" + date.getMinutes();
        // seconds part from the timestamp
        var seconds = "0" + date.getSeconds();
    
        // will display time in 10:30:23 format
        var formattedTime = hours + ':' + minutes.substr(minutes.length-2) + ':' + seconds.substr(seconds.length-2);
        return formattedTime;
    },
    
    dateNow: function() {
            if (!Date.now) {
                Date.now = function() {
                    return new Date().getTime();
                };
            }
            return Date.now();
    },
    
    showAlert: function (message, title) {
        if (this.debug === true) {
            if (navigator.notification) {
                navigator.notification.alert(message, null, title, 'OK');
            } else {
                alert(title ? (title + ": " + message) : message);
            }
        }
    }
};


