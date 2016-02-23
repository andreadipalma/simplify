var SettingsView = function() {
    this.mode = 1;
    this.backgroundDelay = 100;
    var self = this;
    
    this.init = function(page) {
        this.page = page;
    };
    this.show = function() {
        
        // Get the header for the page.
        var $header = this.page.children( ":jqmData(role=header)" );
        
        // Get the content area element for the page.
        var $footer = this.page.children( ":jqmData(role=footer)" );
        
        // Find the h1 element in our header and inject the name of
        // the category into it.
        $header.html( this.buildHeader("Settings View") );
        
        // Inject the category items markup into the content element.
        $footer.html( this.buildFooter('') );
        
        $("input[name=radio-choice-timeout]:radio").bind( "change", function(event, ui) {
                                                         console.log('Mode selected: '+$(this).val());
                                                         self.mode = parseInt($(this).val());
                                                         });
        
        $("#div-sliderFreq").bind( "change", function() {
                                                         console.log('Freq selected: '+$(this).val());
                                                         self.backgroundDelay = parseInt($('#sliderFreq').val());
                                                         });
    };
    
    this.buildHeader = function(message) {
        var markup = "<div class='ui-field-contain'><BR/><BR/>" +
        "<a href='#backhome' data-rel='back' data-icon='back' data-role='button' data-iconpos='notext'  data-inline='true' data-theme='c' class='ui-btn ui-shadow ui-btn-corner-all ui-btn-inline ui-btn-icon-notext ui-btn-up-c'><span class='ui-icon ui-icon-back ui-icon-shadow'>&nbsp;</span></a>" +
        "<SPAN>" + message + "</SPAN>" +
        "</div>";
        return markup;
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