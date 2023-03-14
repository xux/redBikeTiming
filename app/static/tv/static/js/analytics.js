var LapText = 'lap';
$(document).ready(function() {
	var GraphParams = {};
	var defParams = parseGet('p', false);
	var defParamsParsed = false;
	var graphChartsYQ = '';
	if (defParams != false) {
		defParamsParsed = unpackResponse(defParams);
	}
	function addChildren(r, el) {
		if (typeof el === 'string' || el instanceof String) {
			if (!(el in r))
				r.push(el);
		} else if (el.children.length > 0) {
			for (var i = 0; i < el.children.length; i++) {	
				r = addChildren(r, el.children[i]);
			}
		} else {
			if (!(el.id in r))
				r.push(el.id);
		}
		return r;
	}
	function getSelectedData($elTree) {
		var r = [], data = $elTree.get_selected(true);
		for (var i = 0; i < data.length; i++) {
			r = addChildren(r, data[i]);
		}
		return r;
	}
	function FormatYAxisValue(value, addUnits){
		var res = value;
		if ('lapDelayShift' in GraphParams && Math.abs(value) >= GraphParams['lapDelayShift']) {
			if (value % GraphParams['lapDelayShift'] == 0)
				res = (value / GraphParams['lapDelayShift']) + ' ' + LapText;
			else
				res = ''
		} else
		if ('time' in GraphParams && value != 0)
			res = '-' + moment().startOf('day').seconds(Math.abs(value)).format('H:mm:ss');
		if ($.isNumeric(res)) res = parseFloat(res.toFixed(2));
		
		if (addUnits == true) {
			return res + (graphChartsYQ!=''?' ' + graphChartsYQ : '');
		} else {
			return res;
		}
	}
	function onReady() {
		var $graph = $('#graph');
		$graph.highcharts({
			credits: {
				text: 'redBike Analytics', 
				href: '{{BASE_URL}}{{REL_URL}}'
			},
			chart: {
				plotBackgroundColor: null,
				plotBorderWidth: null,
				plotShadow: false,
				zoomType: 'xy',
			},
			title: {
				text: '',
			},
			xAxis: {
				type: 'category',
			},
			yAxis: {
				labels: {
					formatter: function () { return FormatYAxisValue(this.value); }
				},
				title: {
					text: ''
				},
			},
			legend: {
				borderWidth: 0
			},

			tooltip: {
				formatter: function() {
					return 	'<a href="'+this.point.link+'"><b>' + this.point.name + '</b></a><br>' + 
						'<span>' + this.series.name + '</span><br>' + 
						'<b>' + graphChartsYTitle + ': </b><span>' + FormatYAxisValue(this.point.y, true) + '</span><br>' + 
						'<span>' + this.point.cat + '</span>';
				}
			},
			plotOptions: {},
			series: [],

			lang: {
				menu: 'Меню',
				resetZoom: 'Сбросить увеличение',
				resetZoomTitle: 'Сбросить увеличение'
			},
		});
		var graphCharts =  $graph.highcharts();
		var graphChartsYTitle = '';

		function updateGraph( data ) {
			if ('params' in data) {
				GraphParams = data['params'];
			} else {
				GraphParams = {};
			}

			while(graphCharts.series.length > 0)
				graphCharts.series[0].remove(false);
			graphChartsYTitle = $('input[name=yAxis]:checked').closest('label').text();
			if (('yAxis' in GraphParams) && ('unit' in GraphParams['yAxis'])) {
				graphChartsYQ = GraphParams['yAxis']['unit'];
			} else {
				graphChartsYQ = '';
			}
			
			graphCharts.yAxis[0].update({
				title: {
					text: graphChartsYTitle + (graphChartsYQ!=''?', ' + graphChartsYQ : '')
				}
			});
			if ('series' in data)
				for (var i in data['series'])
					graphCharts.addSeries(data['series'][i], false);
			if ('xAxis' in GraphParams) {
				if ('categories' in GraphParams['xAxis']) {
					graphCharts.xAxis[0].setCategories(GraphParams['xAxis']['categories'])
				}
			}
			graphCharts.redraw();
			if ($('input[name=show_table]').prop('checked') ) Highcharts.drawTable(graphCharts, $('#table table'), FormatYAxisValue);
		}


		var $RacesList = $('#races_list');
		var $RacersList = $('#racers_list');
		var redrawTimeout = false;
		function updateRedraw(params) {
			$('.graph.loader').show();
			setURL('/analyze?p=' + encodeURIComponent(params));
			api('action=analyzeGraphData', {
				params: params
			}, function(data) {
				updateGraph(data);
				$('.graph.loader').hide();
			});
		}
		function getRacers(selected) {
			var params = {};
			if (selected != false) {
				params['selected'] = selected;
			} else {
				params['params'] = packRequest(getSelectedData($RacesListTree));
			}
			$('.racers.loader').show();
			api('action=getRacers', params, function( data ) {
				if ('racers' in data) {
				$($RacersListTree.get_json('#', {
					flat: true
				})).each(function () {
					var node = $RacersListTree.get_node(this.id);
					if (!($RacersListTree.is_selected(node)))
						$RacersListTree.delete_node(node);
				});

				var racers = data['racers'];
				for (var i = 0 ; i < racers.length; i++) {
					if (!($RacersListTree.get_node(racers[i]['id']))) {
						var id = $RacersListTree.create_node('#' , racers[i]);//, "last");
					}
				}
				}
				$('.racers.loader').hide();
			});
		}

		function doRedraw(isRaces, isForce) {
			if (isRaces && $('#auto_racers').prop('checked')) {
				getRacers(false);
			}	

			if (!isForce) return;
			
			var params = {
					'yAxis' : $('input[name=yAxis]:checked').val(),
					'yVal' : $('input[name=yVal]:checked').val(),
					'compare' : $('input[name=compare]:checked').val(),
				};
			params['check_params'] = [];
			$('input.check_params:checked').each(function(){
				params['check_params'].push($(this).prop('name'));
			})
			params = [
				getSelectedData($RacesListTree),
				getSelectedData($RacersListTree),
				params
				
			];
			if (params[0].length > 0 && params[1].length > 0)  {
				updateRedraw(packRequest(params));
			}

		}
		function redraw1() { doRedraw(true, false)};
		function redraw2() { doRedraw(false, false)};
		function onLoaded() {
			if (defParamsParsed != false) {
				getRacers(encodeURIComponent(packRequest(defParamsParsed[1])));
				for (var param in defParamsParsed[2]) {
					if (param == 'check_params') {
						for (var n in defParamsParsed[2][param]) {
							$('input[name=' + defParamsParsed[2][param][n] + ']').prop('checked', true).change();
						}
					} else {
						$('input[name=' + param + ']').val([defParamsParsed[2][param]])
					}
				}
				updateRedraw(defParams);
			};
			$('.params.loader').hide();
			$('.racers.loader').hide();
			$('.graph.loader').hide();
		};
		$('#updateBtn').click(function() { doRedraw(false, true); return false; });
		function changeHeight(val) {
			$('#graph').css('height', (parseInt($('#graph').css('height')) + val * 100) + 'px');
			graphCharts.reflow();
		}
		$('#incGraphHeight').click(function() { changeHeight(+1) });
		$('#decGraphHeight').click(function() { changeHeight(-1) });


		$RacesList.bind("select_node.jstree", function(evt, data) {
			setTimeout(redraw1, 0);
		}).bind("deselect_node.jstree", function(evt, data) {
			setTimeout(redraw1, 0);
		});
		$RacersList.bind("select_node.jstree", function(evt, data) {
			setTimeout(redraw2, 0);
		}).bind("deselect_node.jstree", function(evt, data) {
			setTimeout(redraw2, 0);
		});
		$RacesList.jstree({
			'plugins' : [ 'wholerow', 'checkbox'],
			'core' : {
				'data' : {
					'url' : '/api/?action=racesList',
					'data' : function (node) {
						var d = { 'id' : node.id };
						if (defParamsParsed != false) {
							d['def'] = encodeURIComponent(packRequest(defParamsParsed[0]));
						}
						return d;
					}
				}
			},
		}).bind('loaded.jstree', function(){
			$('.races.loader').hide();
		});
		$RacersList.jstree({
			'plugins' : [ 'wholerow', 'checkbox'],
			'core' : { 
				'check_callback' : true,
				'data' : [],
			}
		}).bind('loaded.jstree', onLoaded);

		var $RacesListTree = $RacesList.jstree();
		var $RacersListTree = $RacersList.jstree();
		$('#racer_search').autocomplete(autoCompleteData('racer', false, function(ui) {
			$('#racer_search').val('');
			var id = $RacersListTree.create_node('#' ,  { "id" : ui.item.value, "text" : ui.item.label, "icon" : "glyphicon glyphicon-user"}, "last");
			$RacersListTree.select_node(id);
			
		}));
		$('#selectAll').click(function() { $RacersListTree.select_all(); return false; });
		$('#deselectAll').click(function() { $RacersListTree.deselect_all(); return false; });

	};
	LoadJSTree(function(){
		LoadHighCharts(onReady);
	});
	$(':checkbox,:radio').change(function(){
		if (!$(this).prop('checked')) return;

		var inputs = $(this).data('input-disable');
		if (inputs) {
			$(inputs.split(',')).each(function(i, v) {
				$('input[name="' + v + '"]').prop('disabled', true);
			});
		}
		inputs = $(this).data('input-enable');
		if (inputs) {
			$(inputs.split(',')).each(function(i, v) {
				$('input[name="' + v + '"]').prop('disabled', false);
			});
		}
	}).change();

});
