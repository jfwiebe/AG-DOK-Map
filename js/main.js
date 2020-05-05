var map,
	mapData,
	tagFilterButton;

(function($) {
	
	fixMCG();
	initMap();

	$('#introCloseButton').click(function() {
		$(this).hide();
		$('#introText').hide();
	});

})(jQuery);
