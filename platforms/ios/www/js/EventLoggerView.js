var EventLoggerView = function(page) {
    this.storageManager = null;
    this.page = page;
    this.eventList = null;
    this.type = null;
    var self = this;
    
    this.show = function($type, $storageManager) {
        var pageEvents = $._data($(this.page)[0], "events");
        if (typeof pageEvents === 'undefined') {
            $(this.page).on('pageshow', this.loadTable);
        }
        
        this.storageManager = $storageManager;
        this.type = $type;
        
        // Get the header for the page.
        var $header = this.page.children( ":jqmData(role=header)" );
        
        // Get the content area element for the page.
        var $content = this.page.children( ":jqmData(role=content)" );
        
        // Find the h1 element in our header and inject the name of
        // the category into it.
        $header.html( this.buildHeader("Event Logger View") );
        
        // Inject the category items markup into the content element.
        $content.html( this.buildContent("acceleration") );
    };
    
    this.buildHeader = function(message) {
       var markup = "<div class='ui-field-contain'><BR/><BR/>" +
            "<a href='#backhome' data-rel='back' data-icon='back' data-role='button' data-iconpos='notext'  data-inline='true' data-theme='c' class='ui-btn ui-shadow ui-btn-corner-all ui-btn-inline ui-btn-icon-notext ui-btn-up-c'><span class='ui-icon ui-icon-back ui-icon-shadow'>&nbsp;</span></a>" +
            "<SPAN>" + message + "</SPAN>" +
            "<input id='transferBtn' type='button' data-theme='c' class='ui-btn ui-mini' value='Transfer'/>" +
            "</div>";
       return markup;
    };
    
    this.transferFile = function() {
        console.log("Transfer method started");
        $("body").addClass('ui-loader-background ');
        $.mobile.loading("show",{
                         text: "Transfering data",
                         textVisible: true
                         });
       
        //self.storageManager.getStoredSamples(self.type).then(self.storageManager.compress).then(self.storageManager.transfer).done(
        self.storageManager.transfer().done(
            function () {
                $.mobile.loading("hide");
                $("body").removeClass('ui-loader-background ');
            }
                                                                                                                                   
        );
       
        console.log("Transfer method completed");
    };
    
    this.buildContent = function(type) {
        var markup = "<table data-role='table' data-mode='columntoggle' class='ui-responsive table.history' id='sampleTable'>" +
            "<thead>" +
            "<tr><span id='countSamples' class='ui-li-count ui-btn-up-c ui-btn-corner-all'>Count: " + this.storageManager.count(type) +
            "</span></tr>" +
            "<tr>" +
            "<th>Timestamp</th>" +
            "<th>Acc. X</th>" +
            "<th data-priority='1'>Acc. Y</th>" +
            "<th data-priority='2'>Acc. Z</th>" +
            "<th data-priority='3'>Label</th>" +
            "</tr></thead><tbody></tbody></table>";
        return markup;
    }; 

    this.loadTable = function(event, ui) {
            $('#transferBtn').click(self.transferFile);
            $("body").addClass('ui-loader-background ');
            $.mobile.loading("show",{
                         text: "Loading data",
                         textVisible: true
                         });

            self.storageManager.getStoredSamples(self.type).done(function (dataList) {
                                Utils.showAlert('Entered callback ' + dataList.length);
                                self.eventList = dataList;
                                var countSamples = dataList.length;
                                             
                                for (var i=0; (i < dataList.length && i < 50); i++) {
                                                //Utils.showAlert('entered loop: '+ i + ' value:' + dataList[i].x);
                                                var markup = '';
                                                markup += "<tr>";
                                                markup += "<td>" + Utils.formatTime(dataList[i].timestamp) + "</td>";
                                                markup += "<td>" + dataList[i].x.toFixed(3) + "</td>";
                                                markup += "<td>" + dataList[i].y.toFixed(3) + "</td>";
                                                markup += "<td>" + dataList[i].z.toFixed(3) + "</td>";
                                                markup += "<td>" + dataList[i].trainingLabel + "</td>";
                                                markup += "</tr>";
                                                $('#sampleTable').append(markup);
                                }
                                $('#countSamples').html('Count: ' + countSamples);
                                                                 
                                $.mobile.loading("hide");
                                $("body").removeClass('ui-loader-background ');

                                Utils.showAlert('Completed callback');
                                }). fail(function() {
                                    $.mobile.loading("hide");
                                    $("body").removeClass('ui-loader-background ');
                                         
                                    Utils.showAlert('Completed fail callback');
                                });
    };
    
    this.buildFooter = function(message) {
        var markup = "<span>" + message + "</span>";
        return markup;
    };
    
    this.render = function() {
        // Pages are lazily enhanced. We call page() on the page
        // element to make sure it is always enhanced before we
        // attempt to enhance the listview markup we just injected.
        // Subsequent calls to page() are ignored since a page/widget
        // can only be enhanced once.
        $(this.page).page();
        $content = $(this.page).children( ":jqmData(role=content)" );
        
        $content.find( ":jqmData(role=table)" ).table();
    };
    
};