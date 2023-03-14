var
	addListItem, removeListItem, autofillItem, restartService, setValueNow,
	ConfigAction,
	editFunc, newData, deleteData,  
	setStatusButtonIcon,
	InitSplits, InitResults, InitLaps,
	InitManualSplits, sendData, changeSplitStatus, syncPanel, InitEditTable, copy2clipboard,
	enableAPI;

$(function(){
//var PageData = {};
var 
	apiRaceID = '/api',
	tagDeadTime = 10000
;
enableAPI = function (race_id) {
	if (race_id) apiRaceID = apiRaceID + '/' + race_id;
	$.ajax({ 
		'url': apiRaceID + '/config', 
		'type': 'GET',
		'success' : function (data) {
			if (data && data.hasOwnProperty('DeadTimeMSec')) tagDeadTime = data['DeadTimeMSec'];
			if (data && data.hasOwnProperty('UpdateTimeoutMSec')) periodicAPITimeout = data['UpdateTimeoutMSec'];
		}
	});
}

sendData = function(){}; //to be reloaded
addListItem = function(self)
{
	var n = $(self).closest('.list-group').find('.list-group-item.new');
	n.clone().removeClass('new d-none').insertBefore(n);
};
removeListItem = function(self) 
{
	$(self).closest('.list-group-item').remove();
};
autofillItem = function(self) 
{
	$(self).closest('.form-group').find('input').val($(self).text());
};

restartService = function (name) 
{
	$.ajax({ 
		'url': '/api/service', 
		'data': {'name' : name, 'action' : 'restart'},
		'type': 'GET',
		'success' : function (data) {
			alert(data);
		}
	});
}
syncPanel = function()
{
	$.ajax({ 
		'url': apiRaceID + '/syncpanel', 
		'type': 'GET',
		'success' : function (data) {
			alert(data);
		}
	});
}
setValueNow = function(el) {
	$(el).closest('.input-group').find('input').val(TimeStr(Now()));
}

ConfigAction = function(action) {
	$.ajax({ 
		'url': apiRaceID + '/config/' + action, 
		'type': 'PUT',
		'data' : {
			'now' : TimeStr(Now(), true)
		},
		'success' : function (data) {
			alert(data);
		}
	});
}

function StatusButtonMarked(data, status) {
	if (data && data.hasOwnProperty('status') && data['status'].indexOf(status) > -1)
		return 'btn-success';
	else
		return 'btn-default';
	
}
function textNonZero(v, z){
	return v == 0 ? z : v;
}
function setLapColor(lapElement, color) {
	var r = color < 0 ? 255 : 0,
		g = color > 0 ? 255 : 0;
	lapElement.css('background-color', 'rgba('+r+','+g+',0, '+Math.abs(color)+')');
}
var StatusButtonIcon = [];
setStatusButtonIcon = function (s) {
	StatusButtonIcon = s;
}

DropDownSelect = function(el) {
	$(el).closest('.input-group').find('input[type=text]').val($(el).text());
}

InitSplits = function(id, ApiData) {
	PeriodicAPICall(apiRaceID + '/splits', 'GET', ApiData, function(splits){
		for (var i in splits) {
			splits[i]['first_time'] = Time(splits[i]['first_time']);
			splits[i]['last_time'] = Time(splits[i]['last_time']);
			splits[i]['peak_time'] = Time(splits[i]['peak_time']);
			UpdateSocketTable('tableData', 'splits_' + splits[i]['db'] + '_' + splits[i]['id'], splits[i], 'first_time', 'last_time', tagDeadTime);
		}
	});
}

InitResults = function(category) {
	PeriodicAPICall(apiRaceID + '/results' + addFirstSlash(category), 'GET', {}, function(results, headers) {
		UpdateSocketTableHeaders('tableData', headers);
		var colors = [];
		for (var i in results) {
//			var row = UpdateSocketTable('tableData', 'results_' + results[i]['number'], results[i], 'place', false, false, false);
			var row = UpdateSocketTable('tableData', 'results_' + results[i]['order'], results[i], 'order', false, false, false);
			for (var j=1; j <= results[i]['laps']; j++) {
				if (results[i].hasOwnProperty('color_' + j)) setLapColor(row.find('.lap_' + j), results[i]['color_' + j])
				var interim = false;
				if (results[i].hasOwnProperty('interimLaps_' + j)) 
					for (var il in results[i]['interimLaps_' + j]) {
						if (!interim) interim = $('<ul/>');
						interim.append($('<li/>').text(results[i]['interimLaps_' + j][il]));
					}
				if (interim) row.find('.lap_' + j).append('<br>').append(interim);

			}
		}
	});
}

InitLaps = function(url, bibLink, ApiData){
	PeriodicAPICall(apiRaceID + url, 'GET', ApiData, function(items, headers) {
		if (headers) UpdateSocketTableHeaders('tableData', headers);		
		var laps = items;
		$('#tableData tbody').html('');
		var colors = [];
		for (var i in laps) {
			var data = laps[i], 
				splits = $('<ul>').addClass('list-group list-group-flush'),
				number = data['number'];
			if (data['lapTime'])
				data['lapTime'] = secondsToTimeDict(data['lapTime']);
			if (data['totalTime'])
				data['totalTime'] = secondsToTimeDict(data['totalTime']);
			if (data['nextTime'])
				data['nextTime'] = secondsToTimeDict(data['nextTime']);
			if ('lap' in data) {
				var l = data['lap'];
				data['lap'] = $('<span/>').text(Math.floor(l)).append($('<sub/>').text(textNonZero(Math.round((l - Math.floor(l)) * 100), '')));
				if (data.hasOwnProperty('color')) colors.push([data['lap'], data['color']]);
			}
			bibLink += bibLink.endsWith("/") ? "" : "/";
			data['number'] = $('<a href="' + bibLink + number + '" />').addClass('text-dark').html(number);
			for (var j in laps[i]['items']) {
				var id = laps[i]['items'][j]['id']
					buttons = $('<span class="btn-group"/>'),
					statusRec = {
						'db' : laps[i]['items'][j]['db']//,
						//'id' : laps[i]['items'][j]['id']
					};
				if (laps[i]['items'][j]['meta'] && laps[i]['items'][j]['id'])
				{
					for (var b in StatusButtonIcon) {
						buttons.append($('<button type="button" class="btn ' + StatusButtonMarked(laps[i]['items'][j]['meta'], StatusButtonIcon[b][0]) + '" aria-label="' + StatusButtonIcon[b][1] + '" title="' + StatusButtonIcon[b][1] + '" onclick="changeSplitStatus(this, \'' + StatusButtonIcon[b][0] + '\', ' + laps[i]['items'][j]['id'] + ')"><i class="fas ' + StatusButtonIcon[b][2] + '"></i></button>').data('data', statusRec));
					}
					//if (laps[i]['items'][j]['meta'].hasOwnProperty('status')) delete laps[i]['items'][j]['meta']['status'];
				}
				splits.prepend(
						$('<li />').addClass('list-group-item d-flex justify-content-between bg-transparent')
							.append(buttons)
							.append($('<span />').html(TimeStr(Time(laps[i]['items'][j]['time']))))
							.append($('<span />').html(laps[i]['items'][j]['peak']))
							.append($('<small />').addClass('text-muted text-right').html(formatDict(laps[i]['items'][j]['meta'])))
				);
			};
			data['time'] = Time(data['time']);
			data['splits'] = splits;
			UpdateSocketTable('tableData', false, data, false, false, false, false);
		}
		for (var i in colors) {
			setLapColor(colors[i][0].parent(), colors[i][1]);
		}
	});
}

changeSplitStatus = function(btn, status, id) {
	var data = $(btn).data('data');
	data['status'] = status;
	$.ajax({ 
		'url': apiRaceID + '/splits/' + id, 
		'data': JSON.stringify(data),
		'type': 'PUT',
		'success' : function (data) {
			PeriodicAPICallForce();
		}

	})
}
////////////////////////////////////////////////////////

var modified = false;
function setModified() {
	modified = true;
	$("#sender i").removeClass().addClass("fa fa-sync");
}
window.onbeforeunload = confirmExit;
function confirmExit() {
	if (modified) {
	   return "There is unsaved changes. Are you sure, you want to close?";
	}
}

function getSelectedCell(tableID, coll) {
	var $table = $('#' + tableID);
	var res;
	if(coll)
		res = $table.find("tr td:nth-child(" + (coll) + ").bg-primary")
	else
		res = $table.find("tr.bg-primary");
	if (res.length > 0) return res;
}
function getSelectedSubCell(tableID) {
	return $('#' + tableID + " td.bg-secondary");
}

var lastSelected, selectFunc, enterFinished;
function InitSelect(tableID, cellSelect, keyAction) {
	var $table = $('#' + tableID);
	var subSelect = cellSelect ? 'tbody tr td' : 'tbody tr', cellSel = 'tbody tr td';
	var selectedSubCell;
	function doSubSelectMove(oldRow, newRow, indexShift) {
		var index = oldRow.find("td.bg-secondary").index() + 1 + indexShift,
			max = oldRow.find("td").length;
		if (index < 1) index = max;
		if (index > max) index = 1;
		return newRow.find("td:nth-child(" + (index) + ")");
	}
	function doSubSelect(subSel) { 
		if (selectedSubCell) {
//			setModified();
//			sendData();
			selectedSubCell.removeClass('bg-secondary');
		}
		selectedSubCell = $(subSel);
		selectedSubCell.addClass('bg-secondary');
	}
	function doSelect(sel, subSel, skipOther) {
		if (!cellSelect) {
			if (!subSel) {
				subSel = doSubSelectMove($table.find("tr.bg-primary"), sel, 0)
			}
			doSubSelect(subSel);
		}

		if (cellSelect) {
			if (!skipOther) {
				sel.closest("tr").find("td").not(sel).each(function(){
					var $this = $(this),
						selected = getSelectedCell(tableID, $this.index() + 1);
					if ((!selected) || (selected.text() != ""))
						doSelect($this, subSel, true);
				});
			};

			$table.find("tr td:nth-child(" + (sel.index() + 1) + ")").removeClass('bg-primary');
		} else {
			enterFinished();
			$table.find("tr").removeClass('bg-primary');
		}
		sel.addClass('bg-primary');
		lastSelected = sel;
		sel = $(sel);
		if (($(sel).length > 0) && (!sel.isInViewport())) $(sel)[0].scrollIntoView();
	}
	function doEdit(sel) {
		if (editFunc) editFunc(sel.index() + 1);
	}
	selectFunc = doSelect;
	$table.on("click", cellSel, function(event) {
		doSelect($(this).closest(subSelect), $(this), false);
	});
	$table.on("dblclick", subSelect, function(event) {
		doEdit($(this));
	});

	function selectMove(up) {
		if (!lastSelected) {
			if (up)
				lastSelected = $table.find(subSelect).last();
			else
				lastSelected = $table.find(subSelect).first();
		}
		var newSelect;
		if (up) {
			newSelect = lastSelected.closest('tr').prev('tr');
		} else {
			newSelect = lastSelected.closest('tr').next('tr');
		}
		if (newSelect.length == 0) {
			if (up)
			newSelect = $table.find(subSelect).last();
		else
			newSelect = $table.find(subSelect).first();
		}
		if (cellSelect) newSelect = newSelect.find("td");
		newSelect.each(function(){doSelect($(this), undefined,  false)}); 
		return newSelect;
	}
	function subSelectMove(left) {
		var row = $table.find("tr.bg-primary");
		doSubSelect(doSubSelectMove(row, row, left ? -1 : 1));
	}
	
	$(window).keydown(function(e) {
		if (e.ctrlKey) 
			return true;

		var prevent = true;
		if(e.keyCode == 38)
			selectMove(true);
		else
		if(e.keyCode == 40)
			selectMove(false);
		else
		if(e.keyCode == 39)
			subSelectMove(false);
		else
		if(e.keyCode == 37)
			subSelectMove(true);
		else
		if ((!keyAction) || (!keyAction(e.key, e.keyCode)))
			prevent = false;
		if (prevent)
			e.preventDefault();
		return !prevent;
	});
}

InitManualSplits = function (tableID, db, status) {
	if (!status) status = '';
	status = status.split('-');
	var id = 0;
	var $table = $("#" + tableID);

	InitSelect(tableID, true, function(key, keyCode) {
		res = true;
		if((keyCode == 32) || (keyCode == 107)) { //SPACE or PLUS
			selectNextEmpty($table, 2);
			changeTime();
			selectNextEmpty($table, 2);
		}
		else
		if(keyCode == 13)
			selectNextEmpty($table, 1);
		else
		if ((keyCode == 112) || (keyCode == 106)) // F1 or *(NUM)
			sendData();
		else
		if ((keyCode == 117) || (keyCode == 61)) { // F6 or =
			if (editFunc) editFunc(1);
		} else
		if ((keyCode == 118) || (keyCode == 111)) { // F7 or /(NUM)
			if (editFunc) editFunc(2);
		} else
		if ((key.length == 1) || (keyCode == 8)) // KEY or BACKSPACE
			changeNumber(key, keyCode);
		else 
			res = false;
		if (!res) console.log(keyCode);
		return res;

	});
	function selectNextEmpty($table, col, skipOther=true) {
		if ($table.find("tbody tr").first().find("tr:not(:empty)").length > 0) {
			addEmpty();
		}

		var $new = $("table").find("tr td:nth-child(" + (col) + ").bg-primary");
		if ($new.is(":empty")) return; 

		$new = $new.parent().prevAll("tr").find("td:nth-child(" + (col) + "):empty").last();
		if ($new.length == 0) {
			$new = addEmpty();
			$new = $new.find("td:nth-child(" + (col) + ")");
			setModified();
		}
		if (selectFunc) selectFunc($new, skipOther);
	}
	function addManualSplit(uid, number, time) {
		id = Math.max(id, uid);
		if (uid == 0){
			id += 1;
			uid = id;
		};
		var data = {'id' : uid, 'db' : db, 'number': number, 'time': time, 'status' : status};
		var row = UpdateSocketTable(tableID, 'split_' + uid, data, 'time', false, false, false);
		row.data('data', data);
		return row;
	}
	function addEmpty() {
		return addManualSplit(0, "", 0);
	}
	function changeNumber(key, keyCode) {
		var selected = getSelectedCell(tableID, 1);
		if (!selected) return;
		if (keyCode == 8) {
			selected.text(selected.text().slice(0, -1));
		} else {
			selected.text(selected.text() + key);
		}
		setModified();
	}
	function changeTime() {
		var selected = getSelectedCell(tableID, 2);
		if (!selected) return;
		selected[0].value = new Date();
		selected.text(TimeStr(selected[0].value));
		setModified();
	}
	function ask(msg, v) {
		var r = prompt(msg, v);
		if (r != "" && r !== null)
			return r
		else 
			return '';//v;
	}
	editFunc = function(index) {
		var sel = getSelectedCell(tableID, index)
		if (!sel) return;
		if (index == 2) {
			var v = ask("Change split", TimeStr(sel[0].value));
			if (v != '')
				v = StrTime(v);
			sel[0].value = v;
			sel.text(TimeStr(sel[0].value));
		} else {
			sel.text(ask("Change value", sel.text()));
		}
		setModified();
	}
	sendData = function(force) {
		data = [];
		var table = $("#" + tableID),
			sender = $("#sender i");
		if (force) modified = true;
		if (!modified) {
			return;
		}
		modified = false;
		$(table.find('tbody tr').get().reverse()).each(function(){
			var t = $(this),
				row = t.data('data');
			$.each(table[0].fields, function(i, field){
				var f = t.find('td.' + field);
				row[field] = f.text();
				if ((f[0].hasOwnProperty('value')) && (f[0].value != '')) {
					row[field] = f[0].value.getTime() / 1000;
				}
			});
			data.push(row);
		});

		$.ajax({ 
			'url': apiRaceID + '/splits', 
			'data': JSON.stringify({'splits': data, 'db': db}),
			'type': 'PUT'
		}).done(function() {
			sender.removeClass().addClass("fa fa-check");
		})
		.fail(function() {
			sender.removeClass().addClass("fa fa-times");
			setModified();
		});
		$("#sender button").blur();
	}
	$.ajax({ 
		'url': apiRaceID + '/splits', 
		'data': {'db' : db},
		'type': 'GET',
		'success' : function (data) {
			if ('items' in data) 
				for (var i in data['items'])
					addManualSplit(data['items'][i]['id'], data['items'][i]['tag'], Time(data['items'][i]['last_time']));
			modified = false;
			$("#sender i").removeClass().addClass("fa fa-check");
			selectNextEmpty($table, 2, false);

		}
	});
	setInterval(sendData, 10000);
}

InitEditTable = function (tableID, api_url, modalID) {
	api_url = apiRaceID + api_url;
	var table = $("#" + tableID);
	InitSelect(tableID, false, function(key, keyCode) {
		res = true;
		if ($('#' + modalID).is(':visible'))
			return false;

		if (keyCode == 13) 
			enterFinished();
		else
		if ((key.length == 1) || (keyCode == 8)) // KEY or BACKSPACE
			changeCell(key, keyCode);
		else 
			res = false;
		return res;

	});
	enterFinished = function(){
		fillForm();
		sendData();
	};
	function changeCell(key, keyCode) {
		var selected = getSelectedSubCell(tableID);
		if (!selected) return;
		if (keyCode == 8) {
			selected.text(selected.text().slice(0, -1));
		} else {
			selected.text(selected.text() + key);
		}
		var tr = selected.closest('tr'),
			data = tr.data('data');
		if (!data) data = {};
		data[selected.index()] = selected.text();
		tr.data('data', data);
		setModified();
	}

	function UpdateRow(data) {
		var id;
		if (data.hasOwnProperty('id')) id = data.id;
		var row = UpdateSocketTable(tableID, id, data, false, false, false, true);
		row.data('data', data);
	}
	function fillForm() {
		var form = $('#' + modalID).find('form'),
			selRow = getSelectedCell(tableID);
		if (selRow) {
			var data = selRow.data('data');
			for (var k in data) {
				form.find('#field-' + k).val(data[k]);
			}
			return form;
		}

	}
	sendData = function(force) {
		if (force) modified = true;
		if (!modified) {
			return;
		}
		modified = false;

		$.ajax({ 
			'url': api_url, 
			'data' : $('#' + modalID).find('form').serializeObject(),
			'type': 'PUT'
		});
	}
	editFunc = function(index) {
		if (fillForm()) {
			$('#' + modalID).modal('show');
		} else {
			newData();
		}
	};
	newData = function() {
		var form = $('#' + modalID).find('form');
		form.trigger('reset');
		$('#' + modalID).modal('show');
	};
	deleteData = function() {
		var selRow = getSelectedCell(tableID);
		if (selRow) 
			$.ajax({ 
				'url': api_url, 
				'data' : selRow.data('data'),
				'type': 'DELETE'
			});
	};
	
	PeriodicAPICall(api_url, 'GET', {}, function(data){
		if (data)
			for (var i in data) UpdateRow(data[i]);
	});
}
	
copy2clipboard = function(el) {
	var input = document.createElement('input');
	input.setAttribute('value', el.innerText);
	document.body.appendChild(input);
	input.select();
	var result = document.execCommand('copy');
	document.body.removeChild(input);
}

/////////////////////////////////////////////////////////////////
$(window).scroll(function () {
	if ($(this).scrollTop() > 50) {
		$('#back-to-top').fadeIn();
	} else {
		$('#back-to-top').fadeOut();
	}
});
// scroll body to 0px on click
$('#back-to-top').click(function () {
	$('body,html').animate({
		scrollTop: 0
	}, 400);
	return false;
});

$(function () {
	$('[data-toggle="popover"]').popover()
})

});
