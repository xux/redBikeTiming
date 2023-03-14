var ShowAdvancedClick, ShowGraphicClick;

$(function() {
if (parseGet('iframe', false) != false) {
	$('#tv_logo').hide();
}	

var AbsName = 'Абсолют';

var HeadersClass = {
	"Абс.Место": 'absplace',
	"Кат.Место": 'catplace',
	"Номер": 'number',
	"Фамилия Имя": 'name',
	"Время старта": 'starttime',
	"Г.р.": 'by',
	"Категория": 'category',
	"Город": 'city',
	"Команда": 'team',
	"Время": 'time',
	"Отставание": 'delay',
	"Круги": 'laps'
}

function CategoryLink(name, lname, CategoryIdPreffix) {
	if (typeof(CategoryIdPreffix) == 'undefined') {CategoryIdPreffix = '';}
	var r = '';
	if (name != lname) {
		if (!isTV) { r = '<li><a href="#' + CategoryIdPreffix + name.replace(' ', '_') + '">' + name + '</a></li>';};
	} else {
		r = '<li class="active">' + name + '</li>';
	}
	return r;
}
function CatLinks(cat_names, categories, name, CategoryIdPreffix, addAbsName) {
	r = '';
	for (var i=0; i < categories.length; i++) {
		if (categories[i] != '') {
			r += CategoryLink(categories[i], name, CategoryIdPreffix);
		}
	}	
	if (addAbsName)
		r = CategoryLink(AbsName, name, CategoryIdPreffix) + r;
	if (cat_names != '')
		r = '<li>' + cat_names + '</li>: ' + r;
	r = '<ol class="breadcrumb m-0 p-0">' + r + '</ol>';
	return r;

}
function CreateAnchor(name, CategoryIdPreffix) {
	if (typeof(CategoryIdPreffix) == 'undefined') {CategoryIdPreffix = '';}
	return '<div class="anchor" id="' + CategoryIdPreffix + name.replace(' ', '_') + '" ></div>';
}
function find_column(table, name) {
	return table.find('thead th').map(function() { return $(this).text();}).get().indexOf(name) + 1;
}
function makeCategories(src, column_name) {
	var CategoryIdPreffix = '';
	if (src.length > 1) CategoryIdPreffix = '.';
	src.each(function(i) {
		if (CategoryIdPreffix != '') CategoryIdPreffix = (i + 1) + '.';
		var $this = $(this);
		var otable = $this.find('table');
		for (var col in HeadersClass) 
		{
			var col_i = find_column(otable, col);
			if (col_i > 0) 
			{
				otable.find('td:nth-child(' + col_i + ')').addClass(HeadersClass[col]);
				otable.find('th:nth-child(' + col_i + ')').addClass(HeadersClass[col]);
			}
			if (HeadersClass[col] == 'laps') {
				otable.find('td:nth-child(n+' + (1+col_i) + ')').addClass('laps_i');
				otable.find('th:nth-child(n+' + (1+col_i) + ')').addClass('laps_i');
			}

		}
		otable.find('td:nth-child(' + col_i + ')').addClass(HeadersClass[col]);
		otable.find('th:nth-child(' + col_i + ')').addClass(HeadersClass[col]);

		var otable_clone = otable.clone();
		
		var categories = $('<div></div>');
		otable.after(categories);
		var cats = otable.find('tbody tr td.category').map(function() { return $(this).text();}).get().sort();
		cats=cats.filter(function(itm,i,cats){
			return i==cats.indexOf(itm);
		});
		if (cats.length == 0) return;

		categories.empty();
		for (var i=0; i < cats.length; i++) {
			if (cats[i] == '') {continue;}
			var table = otable_clone.clone();
			table.find('thead').prepend('<tr><th colspan="100" class="category-switch">' + CatLinks(column_name, cats, cats[i], CategoryIdPreffix, true) + '</th></tr>');
			table.find('tbody tr').each(function() { 
				if ($(this).find('td.category').text() != cats[i]) 
					$(this).remove();
			});
			var bestRes = [0, 0, 0];
			table.find("tr").each(function() { 
				var $this = $(this);
				var r_t = $this.find('td.time').text();
				var r_l = $this.find('td.laps').text();
				var delay = ''
				if (bestRes[0] == 0) {
					bestRes[0] = r_t;
					bestRes[1] = r_l;
					bestRes[2] = r_l;
				} else {
					if (bestRes[1] != r_l) {
/*						bestRes[0] = r_t;
						bestRes[1] = r_l;*/
						delay += r_l - bestRes[2];
					}
					if (bestRes[1] == r_l) {
						var time = msToTime(new Date('1970-01-01T' + r_t + 'Z') - new Date('1970-01-01T' + bestRes[0] + 'Z'));
						delay = time;
					}
				}
				$this.find('td.delay').text(delay);
			});
	
	
			table.find("tr").each(function() { 
				$(this).children(":eq(1)").after($(this).children(":eq(0)"));
			});
			if (isTV) {
				table.find('tr').addClass('category'); 
				table = table.html();
				otable.append(table);
			} else {
				categories.append(table);
				$(CreateAnchor(cats[i], CategoryIdPreffix)).insertBefore(table);
			}
		}
		otable.find('thead:first').prepend('<tr><th colspan="100" class="category-switch">' + CatLinks(column_name, cats, AbsName, CategoryIdPreffix, true) + '</th></tr>');
		otable.prepend(CreateAnchor(AbsName, CategoryIdPreffix));
		if (isTV) categories.remove();

		src.find('table tr').each(function(){
			$(this).find('td.time').each(function(){
				var v = $(this).text().split(':');
				if (v.length != 3) return;
				v[0] = parseInt(v[0]) || 0;
				v[1] = parseInt(v[1]) || 0;
				v[2] = parseFloat(v[2]) || 0;
				$(this).text(v[0] + ':' + v[1].pad(2) + ':' + v[2].toFixed(1).pad(4));
			});
			$(this).find('td.laps_i, td.delay').each(function(){
				var v = $(this).text().split(':');
				if (v.length != 3) return;
				v[0] = parseInt(v[0]) || 0;
				v[1] = parseInt(v[1]) || 0;
				v[2] = parseFloat(v[2]) || 0;
				$(this).text((v[0] * 60 + v[1]) + ':' + v[2].toFixed(3).pad(6).slice(0, -2));
			});
			$(this).find('td:eq(3)').each(function(){
				var n = $(this).text().split(' ');
				var t = '';
				if (n.length > 0) 
					t = n[0].capitalize();
				if (n.length > 1) 
					t += ' ' + n[n.length - 1].capitalize();
				$(this).html(t);
			});
				
			if (isTV) {
				$(this).find('th:not(.category-switch).absplace').text('А');
				$(this).find('th:not(.category-switch).catplace').text('К');
			}
		});

	});	
}

function FreezeHeader(selector) {
	if (isTV) return;

	selector.floatThead({
			top: pageTop,
 			position: 'absolute',
			autoReflow: true,
	});
};

var isAuto = parseGet('auto', false) != false;
var isTV = parseGet('tv', false) != false;
var isOnlineBoard = parseGet('board', false) != false;
var counter = 0;
var loader = $('#resultsLoader');
//loader.hide();
var shower = $('#results');
var dataUrl = parseGet('data', undefined);
var widths = parseGet('widths', '').split(',');
var aligns = parseGet('aligns', '').split(',');
var SplitCategory = parseGet('category', undefined);
var local = true;
var tvParams = {};
if (dataUrl == undefined) {
	dataUrl = 'results.csv';
	local = true;
} else {
	dataUrl = '/proxy?u=' + dataUrl.replace(/&/g, '%26').replace(/=/g, '%3d');
	local = false;
}

var lastLoaded = '';
loader.bind("loadComplete", function(){
	shower.find('.load').hide();
	if ((local) || (SplitCategory !== undefined)) makeCategories(loader, 'Категория');
	if (!isTV) {
		shower.hide().html(loader.html()).show();
		loader.html('');
		FreezeHeader(shower.find('table'));
	} else {
		if (lastLoaded == '') {
			updateTVView();
		} else {
			if (lastLoaded != hashCode(loader.html())) return;
		}
	};
	loader.html('');
});

function updateTVView() {
	if (loader.html() == '') return false;
	lastLoaded = hashCode(loader.html());
	
	if ('startTime' in tvParams) {
		var $timeEl = $("#floatTimer");
		if ($timeEl.length == 0) {
			$timeEl = $('<div id="floatTimer"></div>');
			$('body').append($timeEl);
			setInterval(function(){
				var Now = Date.now();
				var sign = '';
				var diff = Now - tvParams['startTime'];
				if (Now < tvParams['startTime']) {
					sign = '-';
					diff = tvParams['startTime'] - Now;
				}
				var msec = diff;
				var hh = Math.floor(msec / 1000 / 60 / 60);
				msec -= hh * 1000 * 60 * 60;
				var mm = Math.floor(msec / 1000 / 60);
				msec -= mm * 1000 * 60;
				var ss = Math.floor(msec / 1000);
				msec -= ss * 1000;
				$timeEl.text(sign + hh + ':' + mm.pad(2) + ':' + ss.pad(2));
			}, 1000);
		}
	};

	if (('viewColumns' in tvParams) && (tvParams['viewColumns'] != 0)) {
		var table = loader.find('table');
		var scale = 1;
		if (table.outerWidth() != 0) {
			scale = $(window).width() / table.outerWidth();
		}
		scale = scale / tvParams['viewColumns'];

		var scalePadding = 0.01;
		scale -= scalePadding;
		var maxHeight = ($(window).height() - shower.offset().top) / scale , height = 0;
		tvParams['viewColumnTables'] = [];
		var rows = [];
		var i = 0;
		table.find('tbody').each(function() {
			$(this).data('cindex', i);
			i += 1;
		});
		var tbodyIndex = 0;
		var trows = table.find('tbody tr');
		trows.each(function(index, item) {
			height += $(this).outerHeight();
			if (((rows.length > 0) && ((height > maxHeight) || (tbodyIndex != $(this).closest('tbody').data('cindex')))) || (index == trows.length - 1)) {
				tbodyIndex = $(this).closest('tbody').data('cindex');
				var ptable = loader.find('table').clone().html('');
			
				ptable.append(rows);
				ptable.find('tr > th').closest('tr').addClass('header');
				tvParams['viewColumnTables'].push(ptable);

				height = $(this).outerHeight()
				rows = [];
			}
			if (rows.length == 0)
			{
				$(this).closest('tbody').prev('thead').find('tr').each(function(){
					height += $(this).outerHeight();
					rows.push($(this).clone());
				});
			}
			
			rows.push($(this).clone());
		});
	
		if (!('columnsLister' in tvParams)) {
			tvParams['columnsLister'] = $('<center></center>').css({
				position: 'absolute',
				right: 0
			});
			tvParams['columnsLister'].insertBefore(shower);
		}

		shower.find('.clear').remove();
		shower.hide().find('table').remove();
		tvParams['columnsLister'].html('');
		var left = 0;
		for (var i = 0; i < tvParams['viewColumnTables'].length; i++) {
			tvParams['viewColumnTables'][i].css({
				'-moz-transform': 'scale(' + scale + ')',
				'-moz-transform-origin': '0 0',
				'-webkit-transform' : 'scale(' + scale + ')',
				'-webkit-transform-origin': '0 0',
				'left': ( 50 * scalePadding + i * (100.0 / tvParams['viewColumns'])) + '%',
			});
			shower.append(tvParams['viewColumnTables'][i]);
			tvParams['columnsLister'].append('<span class="dot"></span>');
		}
		tvParams['columnsLister'].css({
			'margin-top': '-' + tvParams['columnsLister'].outerHeight() + 'px'
		});

		shower.show();

		var left = 0;
		for (var i = 0; i < tvParams['viewColumnTables'].length; i++) {
			tvParams['viewColumnTables'][i].css({
				'left' : left + 'px'
			});
			left += tvParams['viewColumnTables'][i].outerWidth() * scale + 15;
		}

		tvParams['TVTablesShownIndex'] = -1;
		tvParams['redrawTVTables'] = function (addVal) {
			if (typeof(addVal) == 'undefined') addVal = 1;
			tvParams['TVTablesShownIndex'] += addVal;
			if (tvParams['viewColumnTables'].length > tvParams['viewColumns']) 
			{
				if (tvParams['viewColumnTables'].length - tvParams['TVTablesShownIndex'] < tvParams['viewColumns']) {
					tvParams['TVTablesShownIndex'] = 0;
					if (updateTVView()) return;
				}
				if (tvParams['TVTablesShownIndex'] < 0) {
					tvParams['TVTablesShownIndex'] = tvParams['viewColumnTables'].length - tvParams['viewColumns'];
					if (updateTVView()) return;
					return;
				}
			};
			if (tvParams['TVTablesShownIndex'] == 0) LoadResults(false);
			shower.animate({
				'margin-left': '-' + tvParams['viewColumnTables'][tvParams['TVTablesShownIndex']].css('left')
			});
			tvParams['columnsLister'].find('.dot').removeClass('active')
				.slice(tvParams['TVTablesShownIndex'], tvParams['TVTablesShownIndex'] + tvParams['viewColumns']).addClass('active');

			if (('categoryUpdateInterval' in tvParams) && (tvParams['categoryUpdateInterval'] != 0)) {
				if ('categoryUpdateTimeout' in tvParams) clearTimeout(tvParams['categoryUpdateTimeout']);
				if (tvParams['TVTablesShownIndex'] == 0) {
					tvParams['categoryUpdateTimeout'] = setTimeout(tvParams['redrawTVTables'], tvParams['categoryUpdateInterval'] * tvParams['viewColumns']);
				} else {
					if (tvParams['viewColumnTables'].length - tvParams['TVTablesShownIndex'] <= tvParams['viewColumns']) {
						tvParams['categoryUpdateTimeout'] = setTimeout(tvParams['redrawTVTables'], tvParams['categoryUpdateInterval'] * Math.min(2, tvParams['viewColumns']));
					} else {
						tvParams['categoryUpdateTimeout'] = setTimeout(tvParams['redrawTVTables'], tvParams['categoryUpdateInterval']);
					}
				}
			}
		};
		tvParams['redrawTVTables']();
		$(document).keypress(function(e){
			if (e.which == 32) 
				tvParams['redrawTVTables']();
			else 
			if (e.key == 'ArrowRight') 
				tvParams['redrawTVTables']();
			else 
			if (e.key == 'ArrowLeft') 
				tvParams['redrawTVTables'](-1);
		});
	};
	return true;

}

var csvJSLoaded = false;
function LoadResults(isInitial) {
	shower.find('.load').show();
	if (loader.length == 0) return;
	if (!csvJSLoaded) {
		$.getScript( '/tv/static/libs/jquery/jquery.csvToTable.js', function( data, textStatus, jqxhr ) {
			csvJSLoaded = true;
			LoadResults(isInitial);
		});
		return;
	}

	counter += 1;
	
	var url = loader.data('csv');
	if (!url) url = dataUrl + (local?'?c=' + counter.toString():'')
	if (url.indexOf('.csv') != -1) {
		if (local) {
			$.get(url.replace('.csv', '_title.html'), function(data) {
				if (data.indexOf('<html') > -1) return;
				$('#resultsTitle').html(data);
			});
		}
		$.get(url.replace('.csv', '_header.html'), function(data) {
			if (data.indexOf('<html') > -1) return;
			$('#resultsHeader').html(data);
		});
		function doLoadData() {
			loader.html('').CSVToTable(url, { 
				errorText: 'Произошла ошибка',
				startLine: 0, 
				headerLines: parseInt(parseGet('headers', 1)),
				separator: parseGet('sep', ','),
				widths: widths,
				aligns: aligns,
				tableClass: 'table table-hover table-condensed'
			});
		}
		if (isTV) {
			$('body').addClass('tv');
			$.get(url.replace('.csv', '_params.dat'), function(data) {
				tvParams['data'] = data;
				data = data.split('\n');
				if (data.length > 0) {
					tvParams['startTime'] = data[0].toDateFromDatetime();
				}
				if (data.length > 1) {
					tvParams['viewColumns'] = parseInt(data[1]) || 0;
				}
				if (data.length > 2) {
					tvParams['categoryUpdateInterval'] = parseInt(data[2]) || 0;
				}
				if ((data.length > 4) && (isOnlineBoard) && (!('board' in tvParams))) {
					$.getScript( '/static/js/online.js', function() {
						tvParams['board'] = new OnlineBoard(data[3], $('#OnlineBoard'), parseInt(data[4])||10);
						if (data.length > 5) {
							tvParams['boardHeaders'] = loadJSON(data[5]);
							if (tvParams['boardHeaders'])
								tvParams['board'].setHeaders(tvParams['boardHeaders']);
						}
					});
				}
				doLoadData();
			});
		}
		else 
		{
			doLoadData();
		}
		
	};

};
LoadResults(true);



ShowAdvancedClick = function(el) {
	var $table = $(el).closest('.floatThead-wrapper');
	if ($table.find('tbody').length == 0) {
		$table = $(el).closest('table');
		if ($table.find('tbody').length == 0) 
			$table = $(el).closest('table').parent().next('table');
	}
	$table.toggleClass('advanced-visible');
	$('table').floatThead('reflow');
};
ShowGraphicClick = function(el) {
	var $table = $(el).closest('table');
	if ($table.find('tbody').length == 0) 
		$table = $(el).closest('table').parent().next('table');
	function doShow() {
		var $chart = $table.find('tr:last .chart');
		if ($chart.length == 0) {
			$chart = $("<div class='chart'></div>");
			$table.find('tbody').append($('<tr></tr>').append($('<td colspan="100"></td>').append($chart)));
			ScrollTo($chart);
		} else {
			$chart.closest('tr').show();
			ScrollTo($chart);
			return;
		}

		var tableData = [];
		$table.find('tbody tr').each(function() {
			var $this = $(this);
			var d = [];
			$this.find('.lap').each(function() {
				var t = $(this).find('.position').text()
				var v = parseInt($(this).find('.position').text())||0;
				if (v > 0)
					d.push({
						y: v, 
						position: $(this).find('.position').text(),
						time: $(this).find('.time').text(), 
						total: $(this).find('.total').text(), 
						delay: $(this).find('.delay').text(), 
					});
				else if (t == '')
					d.push(null);
			});
			if (d.length > 0)
				tableData.push({
					name : $this.find('.name').text(),
					data: d
				});
		});
		var hchart;
		$chart.highcharts({
			credits: false,
			chart: {
				zoomType: 'xy'
			},
			title: {
				text: 'Результаты заезда',
				x: -20
			},
			subtitle: {
				text: 'Категория: ' + $table.find('th.category-switch li.active').text(),
				x: -20
			},
			xAxis: {
				categories: $table.find('thead span.laps').map(function(){
											return $.trim($(this).text());
										}).get(),
			},
		        yAxis: {
				reversed: true,
				title: {
					text: 'Место'
				},
				plotLines: [{
					value: 0,
					width: 1,
					color: '#808080'
				}]
			},
			legend: {
				layout: 'vertical',
				align: 'right',
				verticalAlign: 'middle',
				borderWidth: 0
			},
			series : tableData,
			tooltip: {
				formatter: function () {
					return '<b>' + this.series.name + '</b><br/>' +
						this.x + '<br/>' +
						'Позиция: ' + this.point.position + '<br/>' +
						'Время круга: ' + this.point.time + '<br/>' +
						'Общеее время: ' + this.point.total + '<br/>' +
						'От лидера: ' + this.point.delay;
				},
	        	},
			lang: {
				close: 'Закрыть',
				menu: 'Меню',
				resetZoom: 'Сбросить увеличение',
				resetZoomTitle: 'Сбросить увеличение'
			},
			exporting: {
				buttons: [
				{
					symbol: 'cross',
					_titleKey: 'close',
					x: 0,
					onclick: function() {
        					$chart.closest('tr').hide();
					}
				},
				{
					symbol: 'menu',
					_titleKey: 'menu',
					x: 0,
					verticalAlign : 'bottom',
					menuItems: [
					{
						text: 'Показать всех',
						onclick: function() {
							for(i=0; i < hchart.series.length; i++) {
								hchart.series[i].setVisible(true, false);
							}
						}
					
					},
					{
						text: 'Скрыть всех',
						onclick: function() {
							for(i=0; i < hchart.series.length; i++) {
								hchart.series[i].setVisible(false, false);
							}
						}
					
					}
					]
				},
				]
			}
		});
		hchart = $chart.highcharts();
	}
	LoadHighCharts(doShow);
}


	$(document).ready(function() {
		$('.table-advanced .category-switch').each(function(){
			if ($(this).closest('table').find('.advanced').length == 0) return;
			r = '';
			if (isFunction(ShowAdvancedClick)) r += '<li><div class="checkbox"><label><input type="checkbox" onclick="ShowAdvancedClick(this);"><strong>Подробно</strong></label></div></li>';
			if (isFunction(ShowGraphicClick)) r += '<li><a href="#" onclick="ShowGraphicClick(this);return false;">График</a></li>';

			if (r != '')
				$(this).prepend('<ol class="breadcrumb m-0 p-0 pull-right">' + r + '</ol>');
		});
		FreezeHeader($('.table-freeze'));
	});

});
