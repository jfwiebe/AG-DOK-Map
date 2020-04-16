function initMap() {
	
	var map;

	var myIcon = L.ExtraMarkers.icon({
		icon: 'fa-play-circle',
		svg: true,
		markerColor: '#5c878d',
		shape: 'circle',
		prefix: 'fa'
	});

	var myGeoJSONPath = './world.geo.json';
	var myCustomStyle = {
		stroke: true,
		color: '#6f7f8c',
		weight: 1,
		fill: true,
		fillColor: '#232a2c',
		fillOpacity: 1
	};

	getSheetData('1f4UpOnOj79hGxeu5AoDrkKRRD2RGxM9rEmwAhIw2XMM', function(sheetData) {

		console.log(sheetData);

		mapData = sheetData;
		// Tags are already converted to an Array at mapData[0].tags
		
		$.getJSON(myGeoJSONPath,function(data){
			map = L.map( 'filmClipMap', {
				center: [51.0, 10.0],
				minZoom: 3,
				maxZoom: 8,
				zoom: 6
			});

			map.createPane('labels');
			map.getPane('labels').style.pointerEvents = 'none';

			var myTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
				attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
				subdomains: 'abcd',
				pane: 'labels'
			}).addTo(map);

			L.geoJson(data, {
				clickable: false,
				style: myCustomStyle
			}).addTo(map);

			var markers = L.markerClusterGroup();
				
			for (var i=0; i < mapData.length; ++i) {
				var marker = L.marker( [mapData[i].latitude, mapData[i].longitude], {icon: myIcon} );

				var tagList = '';

				for (var t=0; t < mapData[i].tags.length; t++) {
					tagList += '<span class="markerTag">'+ mapData[i].tags[t] +'</span>'
				} 

				marker.bindPopup('<div class="markerTitle">'+ mapData[i].title + '</div>'
								+'<iframe style="width: 350px; height: 200px; background: #000;" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen src="'+ mapData[i].videoEmbedURL +'?color=ffffff&portrait=0&byline=0&title=0&badge=0"></iframe>'
								+'<div><a href="'+ mapData[i].videoURL +'" target="_blank">Video in neuem Tab ansehen</a></div>'
								+'<div>von '+ mapData[i].name +'</div>'
								+'<div>Ort: '+ mapData[i].location +'</div>'
								+'<div class="tagListContainer">Tags: <br>'+ tagList +'</div>', {
					minWidth: 200,
					maxWidth: 350,
					maxHeight: 600
				});
				marker.addTo(markers);
			}

			map.addLayer(markers);

			$('.lds-ring').hide();
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