 (function($) {
  /*
   * Changes the displayed text for a jquery mobile button.
   * Encapsulates the idiosyncracies of how jquery re-arranges the DOM
   * to display a button for either an <a> link or <input type="button">
   */
  $.fn.changeButtonText = function(newText) {
  return this.each(function() {
                   $this = $(this);
                   if( $this.is('a') ) {
                   $('span.ui-btn-text',$this).text(newText);
                   return;
                   }
                   if( $this.is('input') ) {
                   $this.val(newText);
                   // go up the tree
                   $this.prev('span').find('span.ui-btn-text').text(newText);
                   return;
                   }
                   });
  };
  })(jQuery);