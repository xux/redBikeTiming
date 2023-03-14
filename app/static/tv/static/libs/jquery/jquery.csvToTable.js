/**
 * CSV to Table plugin
 *
 * Copyright (c) 2010 Steve Sobel
 * http://honestbleeps.com/
 *
 * 
 *
 */

 
 (function($){

	/**
	*
	* CSV Parser credit goes to Brian Huisman, from his blog entry entitled "CSV String to Array in JavaScript":
	* http://www.greywyvern.com/?post=258
	*
	*/
	String.prototype.splitCSV = function(sep) {
		for (var thisCSV = this.split(sep = sep || ","), x = thisCSV.length - 1, tl; x >= 0; x--) {
			if (thisCSV[x].replace(/"\s+$/, '"').charAt(thisCSV[x].length - 1) == '"') {
				if ((tl = thisCSV[x].replace(/^\s+"/, '"')).length > 1 && tl.charAt(0) == '"') {
					thisCSV[x] = thisCSV[x].replace(/^\s*"|"\s*$/g, '').replace(/""/g, '"');
				} else if (x) {
					thisCSV.splice(x - 1, 2, [thisCSV[x - 1], thisCSV[x]].join(sep));
				} else thisCSV = thisCSV.shift().split(sep).concat(thisCSV);
			} else thisCSV[x].replace(/""/g, '"');
		} return thisCSV;
	};

	$.fn.CSVToTable = function(csvFile, options) {
		var defaults = {
			tableClass: "CSVTable",
			theadClass: "",
			thClass: "",
			tbodyClass: "",
			trClass: "",
			tdClass: "",
			loadingImage: "",
			loadingText: "Loading CSV data...",
			errorText: "Error!",
			separator: ",",
			startLine: 0,
			headerLines: 1
		};	
		var options = $.extend(defaults, options);
		return this.each(function() {
			var obj = $(this);
			var error = '';
			(options.loadingImage) ? loading = '<div style="text-align: center"><img alt="' + options.loadingText + '" src="' + options.loadingImage + '" /><br>' + options.loadingText + '</div>' : loading = options.loadingText;
			obj.html(loading);
			$.get(csvFile, function(data) {
				var tableHTML = '';
				var lines = data.replace('\r','').split('\n');
				var printedLines = 0;
				var headerCount = 0;
				var headers = new Array();
				var tableLine = 0;
				function getWidthStr(col) {
					if ((col < 0) || (col >= options.widths.length)) return '';
					var w = parseInt(options.widths[col]) || 0;
					if (w == 0) return '';
					return 'width="' + w + '"';
				}
				function getStyleStr(col) {
					if ((col < 0) || (col >= options.aligns.length)) return '';
					var w = options.aligns[col].trim();
					if (w == '') return '';
					return 'style="text-align:' + w + ';"';
				}
				$.each(lines, function(lineCount, line) {
					if (line.replace(/,/g, '').trim() == '') {
						tableLine = 0;
						return;
					}

					if (tableLine == options.startLine) {
						if (tableHTML != '') tableHTML += '</tbody></table>';

						tableHTML += '<table class="' + options.tableClass + '"><thead class="' + options.theadClass + '">';
					}
					if (tableLine < options.startLine + options.headerLines) {
						headers = line.trim().splitCSV(options.separator);
						headerCount = headers.length;
						var colspan = 0;
						headerHTML = '';
						$.each($(headers).get().reverse(), function(headerCount, header) {
							if (header.trim() != '') {
								headerHTML = '<th class="' + options.thClass + '" ' + getWidthStr(headers.length - headerCount - 1) + (colspan > 0?' COLSPAN=' + (colspan+1):'') + '>' + header + '</th>' + headerHTML;
								colspan = 0;
							} else {
								colspan += 1;
							}
						});
						tableHTML += '<tr class="' + options.trClass + '">' + headerHTML + '</tr>';
					}
					if (tableLine == options.startLine + options.headerLines - 1) {
						tableHTML += '</thead><tbody class="' + options.tbodyClass + '">';
					}
					if (tableLine >= options.startLine + options.headerLines) {
						var items = line.trim().splitCSV(options.separator);
						if (items.length > 1) {
							printedLines++;
							if (items.length != headerCount) {
								error += 'error on line ' + lineCount + ': Item count (' + items.length + ') does not match header count (' + headerCount + ') \n';
							}
							(printedLines % 2) ? oddOrEven = 'odd' : oddOrEven = 'even';
							tableHTML += '<tr class="' + options.trClass + ' ' + oddOrEven + '">';
							$.each(items, function(itemCount, item) {
								tableHTML += '<td class="' + options.tdClass + '" ' + getStyleStr(itemCount) + '>' + item + '</td>';
							});
							tableHTML += '</tr>';
						}
					}
					tableLine += 1;
				});
				tableHTML += '</tbody></table>';
				if (error) {
					//obj.html(error);
					obj.html('<center><i>' + options.errorText + '</i></center>');
					console.error(error);
				} else {
/*					obj.fadeOut(500, function() {*/
						obj.html(tableHTML);
/*					}).fadeIn(function() {*/
						// trigger loadComplete
//						setTimeout(function() {
							obj.trigger("loadComplete");	
//						},0);
/*					});*/
				}
			});
		});
	};

})(jQuery);
