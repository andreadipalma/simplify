/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

alert("Fake break");

var app = {
    storageManager: null,
    motion: null,
    self: this,
    stopWatch: { isRunning: false},
    eventLoggerView: null,
    settingsView: null,
    
    // Application Constructor
    initialize: function() {
        this.bindEvents();
        try {
            //this.storageManager = new LocalStorageStore();
            this.storageManager = new FileStorageStore();
            this.motion = new MotionManager(this.storageManager);
        } catch (ex) {
            console.log("ERROR!!! " + ex);
        }
    },
    
    showPopup: function (message) {
        if (message) {
            $('#messageDetails').html(message);
            $('#messageDetails').popup('open',{y:0});
            setTimeout(function () {
                       $('#messageDetails').html('');
                       $('#messageDetails').popup('close');
                       }, 3000);

        }
    },
    
    confBackground: function() {
      //  cordova.plugins.backgroundMode.onactivate = app.getMeasure;
      //  cordova.plugins.backgroundMode.ondeactivate = app.getMeasure;
    },
    
    // This method can be used in foreground when the App is active or in background
    // when the App is not active, so running in the background.
    getMeasure: function() {
        // Background using watch API
        if (app.motion.settings.mode === 1) {
            console.log("entered getMeasure");
            // Get sensor measures
            app.motion.startAccMonitoring();
            //app.motion.startGyroMonitoring();
            // Set a new event if in "running" mode
        } else {
            // Background using timeout method
            setTimeout(function () {
                   // Modify the currently displayed notification
                   console.log("entered getMeasure");
                   // Get sensor measures
                   app.motion.getAcc();
                   //app.motion.getGyro();
                   // Set a new event if in "running" mode
                   if (app.stopWatch.isRunning === true) {
                        setTimeout(app.getMeasure, app.backgroundDelay);
                        console.log("Set another timeout is running");
                   }
                   console.log("finished getMeasure");
            }, app.backgroundDelay);
        }
        console.log("called settimeout");
    },
    
    stopMonitoring: function() {
        if (app.motion.settings.mode == 1) {
            app.motion.stopAccMonitoring();
            app.motion.stopGyroMonitoring();
        } else {
            app.stopWatch.isRunning = false;
        }
    },
    
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, true);
    },
    
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
        document.addEventListener('pause', function(){
                                  window.plugin.backgroundMode.enable();
                                  }, false);
        document.addEventListener('resume', function(){
                                  window.plugin.backgroundMode.disable();
                                  }, false);
        window.plugin.backgroundMode.disable();
        app.confBackground();
        app.storageManager.init();
        app.settingsView = new SettingsView();
    
        $("#coordBtn").click(function(){
                             console.log("test navigator.geolocation works well");
                             app.motion.getLocation();
                             console.log("executed geolocation command");
                             });

        $("#accBtn").click(function(){
                           console.log("test navigator.accelerometer works well");
                           app.motion.getAcc();
                           console.log("executed accelerometer command");
                           });
        
        $('#training-selector').on('click', 'a', function(event) {
                                   var button = $(event.target).text();
                                   app.motion.trainingLabel = button;
                                   app.showPopup("Set training label to " + button);
                                   console.log("You clicked on:", button);
                                   });

        
        $('#startBtn').bind('click', { parentObj: this }, function(e) {
                           var parentObj = e.data.parentObj;
                           
                           // Change button state
                           if ($(this).val() === 'Start') {
                                var settings = new MMSettings(app.settingsView.backgroundDelay, app.settingsView.mode);
                                app.motion.init(settings);

                                // Get user frequecy set
                                $(this).changeButtonText('Stop');
                                app.stopWatch.isRunning = true;
                                app.getMeasure();
                                app.showPopup("Sensor monitoring started!");
                                console.log("Monitor thread set to running");
                           } else {
                            
                                $(this).changeButtonText('Start');
                                app.stopMonitoring();
                                app.showPopup("Sensor monitoring stopped.");
                                console.log("Monitor thread set to not running");
                           }
                           console.log("executed on click event command");
                           
                           });
        
        $('#clearBtn').bind('click', { parentObj: this }, function(e) {
                            var parentObj = e.data.parentObj;
                            
                            // Change button state
                            if ($(this).val() === 'Clear') {
                                // Deletes all the data collected in the local storage
                                app.storageManager.clearAll();
                                app.showPopup("Local storage samples deleted!");
                                console.log("Cleared out all the data collected in the local storage");
                            }
                            console.log("executed on click event clear command");
                            
                            });
        
        
        // Listen for any attempts to call changePage().
        $(document).bind( "pagebeforechange", function( e, data ) {
                         // We only want to handle changePage() calls where the caller is
                         // asking us to load a page by URL.
                         if ( typeof data.toPage === "string" ) {
                         // We are being asked to load a page by URL, but we only
                         // want to handle URLs that request the data for a specific
                         // category.
                         var u = $.mobile.path.parseUrl( data.toPage );
                         re = /^#view/;
                         if ( u.hash.search(re) !== -1 ) {
                            // We're being asked to display the items for a specific menu.
                            // Call our internal method that builds the content for the category
                            // on the fly based on our in-memory menu data structure.
                         
                            app.showPage( u, data.options );
                         
                            // Make sure to tell changePage() we've handled this call so it doesn't
                            // have to do anything.
                            e.preventDefault();
                         
                         }
                         }
                         });
     },
    
 
    // Load the page for a specific menu selected, based on
    // the URL passed in. Generate markup for the items in the
    // page, inject it into an embedded page, and then make
    // that page the current active page.
    showPage: function( urlObj, options )
    {
        //var pageName = urlObj.hash.replace( /.*category=/, "" ),
                
		// The pages we use to display our content are already in
		// the DOM. The id of the page we are going to write our
		// content into is specified in the hash before the '?'.
		pageSelector = urlObj.hash.replace( /#.*\?/, "" );
        
        if ( pageSelector ) {
             // Generate a list item for each item in the category
            // and add it to our markup.
            var $page = $('#' + pageSelector);
            
            if (pageSelector === 'event-logger') {
                if (this.eventLoggerView === null) {
                    this.eventLoggerView = new EventLoggerView($page);
                }
                this.eventLoggerView.show('acceleration', app.storageManager);
            } else if (pageSelector === 'settings') {
                this.settingsView.init($page);
                
                this.settingsView.show();
            }
            // We don't want the data-url of the page we just modified
            // to be the url that shows up in the browser's location field,
            // so set the dataUrl option to the URL for the category
            // we just loaded.
            options.dataUrl = urlObj.href;
                                 
            // Now call changePage() and tell it to switch to
            // the page we just modified.
            $.mobile.changePage( $page, options );
        }
    },


    // Update DOM on a Received Event
    receivedEvent: function(id) {
    }
};
