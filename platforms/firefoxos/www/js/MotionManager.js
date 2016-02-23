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
var MMSetting = {
    frequency: 100,
    mode: 0,
    init: function(frequency, mode) {
        this.frequency = frequency;
        this.mode = mode;
    }
};

var MotionManager = function(storageRef) {
    this.settings = new MMSettings(1000, 0);
    this.storage = storageRef;
    this.accWatchID = null;
    this.gyroWatchID = null;
    this.trainingLabel = 'stop';
    
    var self = this;
    
    this.init = function(settings){
        this.settings = settings;
    };
    

    this.startAccMonitoring = function() {
        this.accWatchID = navigator.accelerometer.watchAcceleration(this.onAccSuccess, this.onAccError, { frequency: this.settings.frequency });
    };
    this.stopAccMonitoring = function() {
        navigator.accelerometer.clearWatch(this.accWatchID);
    };
    this.startGyroMonitoring = function() {
        this.gyroWatchID = navigator.compass.watchHeading(this.onGyroSuccess, this.onGyroError, { frequency: this.settings.frequency });
    };
    this.stopGyroMonitoring = function() {
        navigator.geolocation.clearWatch(this.accWatchID);
    };
    
    this.getAcc = function() {
        navigator.accelerometer.getCurrentAcceleration(this.onAccSuccess, this.onAccError);
    };
    this.getGyro = function() {
        navigator.compass.getCurrentHeading(this.onGyroSuccess, this.onGyroError);
    };
    this.getLocation = function() {
        navigator.geolocation.getCurrentPosition(this.onGeoSuccess, this.onGeoError);
    };
    
    this.onAccSuccess = function(acceleration){
        acceleration.trainingLabel = self.trainingLabel;
        self.storage.flush("acceleration", acceleration);
    };
    this.onAccError = function(error){
        console.log('Acceleration error: ' + error);
    };
    this.onGeoSuccess = function(position){
        console.log("position is " + position.coords.latitude + " - " + position.coords.longitude);
        self.storage.flush("position", position);
    };
    this.onGeoError = function(position){
        
    };
    this.onGyroSuccess = function(heading){
        console.log('Heading: ' + heading.magneticHeading);
        self.storage.flush("heading", heading);
    };
    this.onGyroError = function(error){
        console.log('Heading error: ' + error);
    };
};
