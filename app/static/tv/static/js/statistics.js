var addGraph, addMap, MakeAge;

$(document).ready(function() {

addGraph = function(sel, data, name, _type, size, middleAlignTitle, _categories) {
	var q = $('<div class="graphic col-lg-' + size + ' m-b-15"></div>');
	sel.append(q);
	var plotOpt = {}, _tooltip;
	var series = [{
		type: _type,
		name: name,
		innerSize: '50%',
		data: data
	}];
	var xAxis = {
		type: 'category',
	};
	if (_type == 'pie') {
		plotOpt = {
			pie: {
				allowPointSelect: true,
				cursor: 'pointer',
				dataLabels: {
					enabled: true,
					format: '<b>{point.name}</b>: {point.percentage:.1f} %',
					style: {
						color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
					}
				}
			}
		};
		_tooltip = {
			pointFormat: '{series.name}: <b>{point.percentage:.1f}% [{point.y}]</b>'
		};
	} else if (_type == 'column') {
		plotOpt = {
			column: {
				pointPadding: 0,
				borderWidth: 0,
				groupPadding: 0,
				shadow: false,
				dataLabels: {
					enabled: true
				}

			}
		};
		_tooltip = {
			formatter:function(){
				return this.series.name + '<br> Значение: <b>' + this.key + '</b><br>Количество: <b>' + this.y + '</b> ';
			}
		};
	} else if (_type == 'line') {
		plotOpt = {};
		_tooltip = {enabled: true};
		series = data;
	} else if (_type == 'stackcolumn') {
		_type = 'column';
		plotOpt = {
			column: {
				stacking: 'normal',
				dataLabels: {
					enabled: true
				}
			}
		};
		_tooltip = {
			formatter: function() {
				var s = '<b>'+ this.x +'</b>',
					sum = 0;

				$.each(this.points, function(i, point) {
					s += '<br/>'+ point.series.name +': <b>' + point.y + '</b>';
					sum += point.y;
				});
				s += '<br/>Итого: <b>' + sum + '</b>';
				return s;
			},
			shared: true
		};
		series = data;
	}

	if (typeof(_categories) !== 'undefined')
		xAxis['categories'] = _categories;

	q.highcharts({
		credits: false,
		chart: {
			plotBackgroundColor: null,
			plotBorderWidth: null,
			plotShadow: false,
			type: _type
		},
		title: {
			text: name,
			align: 'center',
			verticalAlign: middleAlignTitle ? 'middle': 'top',
		},
		xAxis: xAxis,
		yAxis: {
			title: {
				text: ''
			}
		},
		tooltip: _tooltip,
		plotOptions: plotOpt,
		series: series
	});

	
}
MakeAge = function(d, y) {
	r = {};
	for (k in d) {
		var v = parseInt(k)||0;
		if (v > 0) r[y-v] = d[k];
	}
	return r;
}

var mapJSLoaded = false;

addMap = function(sel, data, name, size) {
	var q = $('<div class="graphic col-lg-' + size + ' m-b-15"></div>');
	sel.append(q);
	
	data.sort(function(a,b) {return b['z'] - a['z'];});

	function doAdd() {
	var chart = Highcharts.mapChart(q[0], {
		credits: false,
		chart: {
			map: 'countries/ru/ru-all'
		},
		title: {
			text: name
		},
		legend: {
			enabled: false
		},
		mapNavigation: {
			enabled: true,
			buttonOptions: {
				verticalAlign: 'bottom'
			}
		},

		colorAxis: {
			min: 0 
		},

		series: [{
				color: '#E0E0E0',
				enableMouseTracking: false
			}, {
				type: 'mapbubble',
				dataLabels: {
					enabled: true,
					format: '{point.name}'
				},
				name: name,
				data: data,
				maxSize: '12%',
			}
		]
	});
	}
	
	if (!mapJSLoaded) {
		$.when(
			$.getScript('https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.3.6/proj4.js'),
			$.getScript('/static/libs/highcharts/maps/modules/map.js'),
			$.getScript('/static/libs/highcharts/maps/modules/exporting.js'),
			$.getScript('/static/libs/highcharts/mapdata/countries/ru/ru-all.js'),
		).then(function() {
			mapJSLoaded = true;
			doAdd();
		});    
		return;
	} else {
		doAdd();
	}
	
}

});
