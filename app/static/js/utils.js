function binary_search_near(a, comparer) {
    var lo = 0, hi = a.length - 1, mid;
    while (lo <= hi) {
        mid = Math.floor((lo+hi)/2);
        if (comparer(a[mid]) > 0)
            hi = mid - 1;
        else if (comparer(a[mid]) < 0)
            lo = mid + 1;
        else
            return a[mid];
    }
    return a[mid];
}
function isNumeric(num) {
	  return !isNaN(num)
}
function compare(a, b) {
	/*if (isNumeric(a) && isNumeric(b))
	{
		a = parseInt(a);
		b = parseInt(b);
	}*/
	if (a > b)
		return 1;
	else
	if (a < b)
		return -1;
	else
		return 0;
}
$.urlParam = function(name){
	var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
	if (!results || results.length < 2)
		return null;
	else
		return results[1] || null;
}

function Time(v) {
	if (v)
		return new Date(v * 1000);
	else
		return;
}
function Now() {
	return new Date();
}
function TimeStr(time, long=false) {
	if (time) {
		if (long) {
			return moment(time).format("DD.MM.YYYY HH:mm:ss.SSSSSS")
		} else {
			return moment(time).format("DD.MM.YYYY HH:mm:ss.SSS")
		}
	} else {
		return '';
	}
}
function StrTime(time, long=false) {
	if (time) {
		if (long) {
			return moment(time, "DD.MM.YYYY HH:mm:ss.SSSSSS").toDate()
		} else {
			return moment(time, "DD.MM.YYYY HH:mm:ss.SSS").toDate()
		}
	} else {
		return new Date(0);
	}
}

function secondsToTimeDict(d, withHours = true) {
    var ms = Math.floor((d % 1) * 1000);
    d = Math.floor(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);
    if (!withHours) m += h*60;

    res = {
    	'm' : m,
    	's' : s,
    	'ms' : ms,
    	'timeDict' : true
    }; 
    if (withHours) res['h'] = h;
    return res;
}
function isDateDict(d){
	return (d.constructor == Object) && (d.hasOwnProperty('timeDict'));

}
function formatDict(d) {
	var res = '';
	if (!d) return res;
	if (d.hasOwnProperty('timeDict')) {
		if (d.hasOwnProperty('h')) res += d['h'].toString() + ':';
		res += d['m'].toString().padStart(2, '0') + ':' + d['s'].toString().padStart(2, '0') + '.' +d['ms'].toString().padStart(3, '0').slice(0, 3);
		return res;
	}
	for (var k in d) {
		if (res != '') res += '<br>';
		res += k;
		if (d[k])
			res += ': ' + JSON.stringify(d[k])
	}	
	return res;
}

function addPath(path) {
	var url = location.pathname;
	url += url.endsWith("/") ? "" : "/";
	return url + path;
}

function updateURLParameter(url, param, paramVal)
{
    var TheAnchor = null;
    var newAdditionalURL = "";
    var tempArray = url.split("?");
    var baseURL = tempArray[0];
    var additionalURL = tempArray[1];
    var temp = "";

    if (additionalURL) 
    {
        var tmpAnchor = additionalURL.split("#");
        var TheParams = tmpAnchor[0];
            TheAnchor = tmpAnchor[1];
        if(TheAnchor)
            additionalURL = TheParams;

        tempArray = additionalURL.split("&");

        for (var i=0; i<tempArray.length; i++)
        {
            if(tempArray[i].split('=')[0] != param)
            {
                newAdditionalURL += temp + tempArray[i];
                temp = "&";
            }
        }        
    }
    else
    {
        var tmpAnchor = baseURL.split("#");
        var TheParams = tmpAnchor[0];
            TheAnchor  = tmpAnchor[1];

        if(TheParams)
            baseURL = TheParams;
    }

    if(TheAnchor)
        paramVal += "#" + TheAnchor;

    var rows_txt = temp + "" + param + "=" + paramVal;
    return baseURL + "?" + newAdditionalURL + rows_txt;
}


var 
	SocketTableInterval = false,
	SocketTableColors = [];
function addTableHeader(table, $head_row, field, text, filter, sortable) {
	if (table.hasOwnProperty('fields') && table.fields.indexOf(field) > -1) 
		return;

	if (!table.hasOwnProperty('fields')){
		table.fields = [];
		table.filters = [];
	}

	var $th = $head_row.find('th[data-field="' + field + '"]');
	if ($th.length == 0) {
		$th = $('<th />').text(text).data('field', field).data('filter', filter);
		$head_row.append($th);
	}

	table.fields.push(field);
	if (filter)
		table.filters.push(field);
	if (sortable) {
		$th.append($("<span>")
						.append($("<a><i class='fa fa-sort-amount-down'></i></a>").attr("href", updateURLParameter(location.href, "sort", field)))
						.append($("<a><i class='fa fa-sort-amount-up'></i></a>").attr("href", updateURLParameter(location.href, "sort", '-' + field))));
	} else {
		$th.append($("<span>"));
	}	
}

function UpdateSocketTableHeaders(tableDataID, headers) {
	var table = $("#" + tableDataID),
		head_row = table.find('thead tr');
	if (head_row.length == 0) {
		if (table.find('thead').length == 0)
			table.append('<thead>');
		head_row = $('<tr>');
		table.find('thead').append(head_row);
	}
	if (head_row.find('th').length != headers.length)
		for (var i = 0; i < headers.length; i++) {
			addTableHeader(table[0], head_row, headers[i]['field'], headers[i]['title'], headers[i]['filter'], headers[i]['sortable']);
		}
}
function UpdateSocketTable(tableDataID, row_id, data, defaultSortField, colorField, colorDeadTime, changeSort=true) {
	if (!SocketTableInterval && colorField && colorDeadTime)
	{
		SocketTableInterval = setInterval(function(){
			var dels = [];
			$.each(SocketTableColors, function(i){
				var t = $(this)[0][0],
					p = 1;
				if (t.hasOwnProperty('colorTime')) { 
					p = (Now() - t.colorTime) / ($(this)[1]);
					var v = 255 * (1 - p);
					$(this)[0].css('background-color', 'rgb(255,'+v+','+v+')');
				}
				if (p >= 1) dels.push(i);
			});
			for (var i = dels.length - 1; i >=0; i--)
				SocketTableColors.splice(dels[i], 1);
		}, 500)
	}
	var table = $("#" + tableDataID);
	if (table.length == 0) 
		return;
	if (table.find('tbody').length == 0) 
		table.append('<tbody>')
	if (!table[0].hasOwnProperty('fields')){
		var head_row = table.find('thead tr');
		head_row.find('th').each(function(){
			addTableHeader(table[0], head_row, $(this).data('field'), $(this).text(), $(this).data('filter'), $(this).data('sortable'));
		});
	}
	var row = table.find('tbody #' + row_id);
	if ((!row_id) || (row.length == 0)) {
		row = $('<tr>').attr('id', row_id);
	} else {
		//row.remove().empty();
		row.empty();
	}
	if (!data) return;
	
	var sortField = $.urlParam('sort'),
		sortDirection = 1;
	if (sortField){
		if ((sortField.length > 0) && (sortField[0] == '-')) {
			sortField = sortField.substr(1);
			sortDirection = -1;
		}
	} else {
		sortField = defaultSortField;
	}
	
	if (colorField) row[0].colorTime = data[colorField];
	if (sortField)
		row[0].sortData = data[sortField];
	else
		row[0].sortData = false;
		
	if (row[0].sortData instanceof Date)
		sortDirection = sortDirection * -1;
	var filter = $.urlParam('filter');
	if (filter) {
		filter = filter.split('|');
		if (filter.length != 2 || filter[1] != data[filter[0]])
			return;
	}
	
	$.each(table[0].fields, function(i, field){
		var td = $('<td>').addClass(field);
		var v = data[field];
		if (!v) v = '';
		if (v instanceof Date) {
			td[0].value = v;
			v = TimeStr(v);
		} 
		else if (isDateDict(v)) {
			v = formatDict(v);
			td[0].value = v;
		} 
		else if (data.hasOwnProperty(field) && data.hasOwnProperty(field + '-link') && (data[field + '-link'])) {
			v = $('<a href="' + data[field + '-link'] + '" />').addClass('text-dark').html(v);
		}

		td.html(v);
		if (table[0].filters.indexOf(field) > -1)
			td.wrapInner($('<a>').addClass('text-dark').attr("href", updateURLParameter(location.href, 'filter', field + '|' + v)));

		row.append(td);
	})
	
	if (colorField && colorDeadTime)
		SocketTableColors.push([row, colorDeadTime]);
	var place = undefined;
	if (row[0].sortData)
		place = binary_search_near(table.find("tbody tr"), function(item){
			return sortDirection * compare(item.sortData, row[0].sortData);
		});
	if (place != undefined) {
		if (sortDirection * compare(place.sortData, row[0].sortData) < 0){
			row.insertAfter(place);
		} else {
			row.insertBefore(place);
		}
	} else {
		if (table.find(row).length == 0)
			table.find('tbody').prepend(row);
	}
	return row;
}
$.fn.isInViewport = function() {
	if ($(this).length == 0) return false;

    var elementTop = $(this).offset().top;
    var elementBottom = elementTop + $(this).outerHeight();

    var viewportTop = $(window).scrollTop();
    var viewportBottom = viewportTop + $(window).height();

    return elementBottom > viewportTop && elementTop < viewportBottom;
};
$.fn.serializeObject = function() {
	var o = {};
	var a = this.serializeArray();
	$.each(a, function() {
		if (o[this.name]) {
			if (!o[this.name].push) {
				o[this.name] = [o[this.name]];
			}
			o[this.name].push(this.value || '');
		} else {
			o[this.name] = this.value || '';
		}
	});
	return o;
};
function checkIfInView(element){
    var offset = element.offset().top - $(window).scrollTop();
    
    if(offset > window.innerHeight){
        //$('html,body').animate({scrollTop: offset}, 1000);
    	element[0].scrollIntoView();
        return false;
    }
   return true;
}
function update_dic(a,b){
	if (!a) return b;
	if (!b) return a;
	
	for(key in b){
		a[key] = b[key];
	}
	return a;
}
var periodicAPITimeout = 10000,
	periodicAPIFunc, periodicAPITimer = false;
function PeriodicAPICall(url, func, AdditionalAPIData, onSuccess) {
	var timestamp = 0;
	periodicAPIFunc = function () {
		if (periodicAPITimer) clearTimeout(periodicAPITimer);
		$.ajax({ 
			'url': url, 
			'data': update_dic(AdditionalAPIData, {'from_timestamp': timestamp}),
			'type': func,
			'success' : function (data) {
				if (data && data.hasOwnProperty('to_timestamp')) timestamp = data['to_timestamp'];
				if (data && data.hasOwnProperty('items') && onSuccess instanceof Function) {
					if (data.hasOwnProperty('headers'))
						onSuccess(data['items'], data['headers']);
					else
						onSuccess(data['items']);
				}
				periodicAPITimer = setTimeout(periodicAPIFunc, periodicAPITimeout);
			},
			error: function () { periodicAPITimer = setTimeout(periodicAPIFunc, periodicAPITimeout);}
		});
		
	};
	periodicAPIFunc();
};
function PeriodicAPICallForce() {
	periodicAPIFunc();
}

function addFirstSlash(url) {
	if (url.length > 0 && url[0] != '/') url = '/' + url;
	return url;
}
