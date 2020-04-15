function initMap() {
	
	var map;

	var myIcon = L.ExtraMarkers.icon({
		icon: 'fa-play-circle',
		svg: true,
		markerColor: '#5c878d',
		shape: 'circle',
		prefix: 'fa'
	});

	var myFilter = [
		/*
		'blur:0px',
		'opacity:100%',
		'sepia:0%',
		*/
		'brightness:90%',
		'contrast:100%',
		'hue:210deg',
		'saturate:30%',
		'grayscale:0%',
		'invert:100%'
	];

	var myGeoJSONPath = './world.geo.json';
	var myCustomStyle = {
		stroke: true,
		color: '#6f7f8c',
		weight: 1,
		fill: true,
		fillColor: '#1e2b37',
		fillOpacity: 0.4
	};

	getSheetData('1f4UpOnOj79hGxeu5AoDrkKRRD2RGxM9rEmwAhIw2XMM', function(sheetData) {

		console.log(sheetData);

		mapData = sheetData;
		// Tags are already converted to an Array at mapData[0].tags
		
		$.getJSON(myGeoJSONPath,function(data){
			map = L.map( 'filmClipMap', {
				center: [20.0, 5.0],
				minZoom: 2,
				zoom: 2
			});

			var myTileLayer = L.tileLayer.colorFilter('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
				filter: myFilter
			}).addTo(map);

			L.geoJson(data, {
				clickable: false,
				style: myCustomStyle
			}).addTo(map);

			var markers = L.markerClusterGroup();
				
			for ( var i=0; i < mapData.length; ++i ) {
				var marker = L.marker( [mapData[i].latitude, mapData[i].longitude], {icon: myIcon} );

				marker.bindPopup('<div>'+ mapData[i].title + '</div>'
								+'<iframe style="width: 350px; height: 200px; background: #000;" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen src="'+ mapData[i].videoEmbedURL +'?color=ffffff&portrait=0&byline=0&title=0&badge=0"></iframe>'
								+'<div><a href="'+ mapData[i].videoURL +'" target="_blank">Video in neuem Tab ansehen</a></div>'
								+'<div>von '+ mapData[i].name +'</div>'
								+'<div>Ort: '+ mapData[i].location +'</div>', {
					minWidth: 200,
					maxWidth: 350,
					maxHeight: 600
				});
				marker.addTo(markers);
			}

			map.addLayer(markers);
		});
	});
	
	
}

function getSheetData(sheetID, callback) {
	$.getJSON('https://spreadsheets.google.com/feeds/list/'+ sheetID +'/od6/public/values?alt=json',function(data){
		var cleanData = [];

		var rows = data.feed.entry;

		//console.log(rows);

		for (var i = 0; i < rows.length; i++) {
			
			var vimeoURLParts = /^(http\:\/\/|https\:\/\/)?(www\.)?(vimeo\.com\/)([0-9]+)$/.exec(rows[i]['gsx$vimeolink']['$t']),
				videoEmbedURL = '//';

			if (vimeoURLParts && vimeoURLParts[4]) {
				videoEmbedURL = '//player.vimeo.com/video/' + vimeoURLParts[4];
			}

			var rowData = {
				'name': rows[i]['gsx$name']['$t'],
				'nameShort': rows[i]['gsx$nameshort']['$t'],
				'title': rows[i]['gsx$filmtitle']['$t'],
				'videoURL': rows[i]['gsx$vimeolink']['$t'],
				'videoEmbedURL': videoEmbedURL,
				'date': new Date(rows[i]['gsx$date']['$t']+ 'T' +rows[i]['gsx$time']['$t'] + ':00Z'),
				'location': rows[i]['gsx$location']['$t'],
				'longitude': parseFloat(rows[i]['gsx$longitude']['$t'].replace(',', '.')),
				'latitude': parseFloat(rows[i]['gsx$latitude']['$t'].replace(',', '.')),
				'tags': rows[i]['gsx$tagsen']['$t'].toLowerCase().replace(' ', '').split(',')
			}
			cleanData.push(rowData);
		}

		callback(cleanData);
	});
}