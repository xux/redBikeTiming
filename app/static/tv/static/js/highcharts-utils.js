$(document).ready(function() {

function prepareSerieName(name) {
	return stringDivider(name, 20, "<br/>\n");
}
function prepareCategoryName(name) {
	return stringDivider(name, 20, "<br/>\n");
}

Highcharts.drawTable = function(chart, table, FormatYAxisValue) {
	table.empty();

	var $row = $('<thead><tr></tr></thead>');
	table.append($row);
	$row.append('<th></th>');
	var categories = chart.xAxis[0].categories;
	$.each(categories, function(i, name) {
		$row.append('<th>' + prepareCategoryName(name) + '</th>');
	});

	$.each(chart.series, function(i, serie) {
		$row = $('<tr></tr>');
		table.append($row);
		$row.append('<th>' + prepareSerieName(serie.name) + '</th>');
		var lastIndex = 0;
		$.each(serie.data, function(row, point) {
			var index = categories.indexOf(point.category);
			for (var j = lastIndex + 1; j < index; j++)
				$row.append('<td></td>');
			$row.append('<td>' + FormatYAxisValue(point.y, true) + '</td>');
			lastIndex = index;
		});
		for (var j = lastIndex; j < categories.length; j++)
			$row.append('<td></td>');

	});
        
}

});
