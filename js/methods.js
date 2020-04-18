var map;

function initMap() {
	

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

	
	getGeoJSONData(myGeoJSONPath, function(data){ 
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

		getSheetData('1f4UpOnOj79hGxeu5AoDrkKRRD2RGxM9rEmwAhIw2XMM', function(sheetData) {
			
			mapData = sheetData;
			// Tags are already converted to an Array at mapData[0].tags

			var markers = L.markerClusterGroup();
			var listOfAllTags = [];
				
			for (var i=0; i < mapData.length; ++i) {
				var marker = L.marker( [mapData[i].latitude, mapData[i].longitude], {
					icon: myIcon,
					tags: mapData[i].tags
				});

				var tagList = '';

				for (var t=0; t < mapData[i].tags.length; t++) {
					tagList += '<span class="markerTag">'+ mapData[i].tags[t] +'</span>';

					if (listOfAllTags.indexOf(mapData[i].tags[t]) == -1) {
						listOfAllTags.push(mapData[i].tags[t]);
					}
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

			tagFilterButton = L.control.tagFilterButton({
				data: listOfAllTags,
				filterOnEveryClick: true,
				clearText: 'Filter zurücksetzen',
				icon: 'fa-tag',
				openPopupOnHover: false
			}).addTo( map );

			map.addLayer(markers);

			tagFilterButton.enableMCG(markers);

			L.DomEvent.disableScrollPropagation(tagFilterButton._container);
			L.DomEvent.disableClickPropagation(tagFilterButton._container);

			getCOVID19Data(function(COVID19Data) {
				console.log(COVID19Data);

				var COVID19Markers = L.layerGroup();

				for (var c=0; c < COVID19Data.length; c++) {
					
					//console.log(COVID19Data[c].Latitude, COVID19Data[c].Longitude);

					if (COVID19Data[c].Latitude && COVID19Data[c].Longitude) {
						
						var isRegional = (COVID19Data[c].RegionName) ? true : false;
						var regionName = (isRegional) ? COVID19Data[c].RegionName : '';
						var circleRadius = calculateCircleRadius(COVID19Data[c].Confirmed, isRegional);

						var marker = L.circleMarker( [COVID19Data[c].Latitude, COVID19Data[c].Longitude], {
							radius: circleRadius,
							stroke: false,
							color: '#ff0000',
							fillOpacity: .13
						});

						marker.bindPopup('<div>'+ COVID19Data[c].CountryName + '</div>'
										+'<div>'+ regionName +'</div>'
										+'<div>Bestätigte Fälle: '+ COVID19Data[c].Confirmed +'</div>', {
							minWidth: 200,
							maxWidth: 350,
							maxHeight: 600
						});

						marker.addTo(COVID19Markers);
					}

				}

				map.addLayer(COVID19Markers);
			});

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

function getGeoJSONData(geoJSONPath, callback) {
	$.getJSON(geoJSONPath,function(data){
		callback(data);
	});
}

function getCOVID19Data(callback) {
	
	//var dataSource = 'https://api.covid19api.com/summary';
	var dataSource = 'https://open-covid-19.github.io/data/data_latest.json';

	$.getJSON(dataSource,function(data){
		callback(data);
	});
}

function calculateCircleRadius(caseNumber, regional) {
	var scaleFactor = (regional) ? 0.02 : 0.01;
	var area = caseNumber * scaleFactor;
	return Math.sqrt(area/Math.PI)*2;			
}

function fixMCG() {
	L.Control.TagFilterButton.include({
		// Goal: read from MCG instead of from _map
		enableMCG: function(mcgInstance) {
			this.registerCustomSource({
				name: 'mcg',
				source: {
					mcg: mcgInstance,
					hide: function(layerSource) {
						var releatedLayers = [];

						for (
							var r = 0; r < this._releatedFilterButtons.length; r++
						) {
							releatedLayers = releatedLayers.concat(
								this._releatedFilterButtons[r].getInvisibles()
							);
						}

						var toBeRemovedFromInvisibles = [],
							i,
							toAdd = [];

						for (var i = 0; i < this._invisibles.length; i++) {
							if (releatedLayers.indexOf(this._invisibles[i]) == -1) {
								for (
									var j = 0; j < this._invisibles[i].options.tags.length; j++
								) {
									if (
										this._selectedTags.length == 0 ||
										this._selectedTags.indexOf(
											this._invisibles[i].options.tags[j]
										) !== -1
									) {
										//this._map.addLayer(this._invisibles[i]);
										toAdd.push(this._invisibles[i]);
										toBeRemovedFromInvisibles.push(i);
										break;
									}
								}
							}
						}

						// Batch add into MCG
						layerSource.mcg.addLayers(toAdd);

						while (toBeRemovedFromInvisibles.length > 0) {
							this._invisibles.splice(
								toBeRemovedFromInvisibles.pop(),
								1
							);
						}

						var removedMarkers = [];
						var totalCount = 0;

						if (this._selectedTags.length > 0) {
							//this._map.eachLayer(
							layerSource.mcg.eachLayer(
								function(layer) {
									if (
										layer &&
										layer.options &&
										layer.options.tags
									) {
										totalCount++;
										if (releatedLayers.indexOf(layer) == -1) {
											var found = false;
											for (
												var i = 0; i < layer.options.tags.length; i++
											) {
												found =
													this._selectedTags.indexOf(
														layer.options.tags[i]
													) !== -1;
												if (found) {
													break;
												}
											}
											if (!found) {
												removedMarkers.push(layer);
											}
										}
									}
								}.bind(this)
							);

							for (i = 0; i < removedMarkers.length; i++) {
								//this._map.removeLayer(removedMarkers[i]);
								this._invisibles.push(removedMarkers[i]);
							}

							// Batch remove from MCG
							layerSource.mcg.removeLayers(removedMarkers);
						}

						return totalCount - removedMarkers.length;
					},
				},
			});

			this.layerSources.currentSource = this.layerSources.sources[
				'mcg'
			];
		},
	});

	////////////////////////////////////////////////
	// Fix for TagFilterButton
	////////////////////////////////////////////////
	L.Control.TagFilterButton.include({
	    _prepareLayerSources: function() {
	        this.layerSources = new Object();
	        this.layerSources['sources'] = new Object();

	        this.registerCustomSource({
	            name: 'default',
	            source: {
	                hide: function() {
	                    var releatedLayers = [];

	                    for (var r = 0; r < this._releatedFilterButtons.length; r++) {
	                        releatedLayers = releatedLayers.concat(
	                            this._releatedFilterButtons[r].getInvisibles()
	                        );
	                    }

	                    var toBeRemovedFromInvisibles = [],
	                        i;

	                    // "Fix": add var
	                    for (var i = 0; i < this._invisibles.length; i++) {
	                        if (releatedLayers.indexOf(this._invisibles[i]) == -1) {
	                            // "Fix": add var
	                            for (var j = 0; j < this._invisibles[i].options.tags.length; j++) {
	                                if (
	                                    this._selectedTags.length == 0 ||
	                                    this._selectedTags.indexOf(
	                                        this._invisibles[i].options.tags[j]
	                                    ) !== -1
	                                ) {
	                                    this._map.addLayer(this._invisibles[i]);
	                                    toBeRemovedFromInvisibles.push(i);
	                                    break;
	                                }
	                            }
	                        }
	                    }

	                    while (toBeRemovedFromInvisibles.length > 0) {
	                        this._invisibles.splice(toBeRemovedFromInvisibles.pop(), 1);
	                    }

	                    var removedMarkers = [];
	                    var totalCount = 0;

	                    if (this._selectedTags.length > 0) {
	                        this._map.eachLayer(
	                            function(layer) {
	                                if (layer && layer.options && layer.options.tags) {
	                                    totalCount++;
	                                    if (releatedLayers.indexOf(layer) == -1) {
	                                        var found = false;
	                                        for (var i = 0; i < layer.options.tags.length; i++) {
	                                            found =
	                                                this._selectedTags.indexOf(layer.options.tags[i]) !==
	                                                -1;
	                                            if (found) {
	                                                break;
	                                            }
	                                        }
	                                        if (!found) {
	                                            removedMarkers.push(layer);
	                                        }
	                                    }
	                                }
	                            }.bind(this)
	                        );

	                        for (i = 0; i < removedMarkers.length; i++) {
	                            this._map.removeLayer(removedMarkers[i]);
	                            this._invisibles.push(removedMarkers[i]);
	                        }
	                    }

	                    return totalCount - removedMarkers.length;
	                },
	            },
	        });
	        this.layerSources.currentSource = this.layerSources.sources['default'];
	    },
	});
}