var OnlineBoard;
$(function() {
var fadeOutProp = 0.3;
OnlineBoard = function(wsPath, $element, recordShowTime) {
	self = this;
	self.enabled = false;
	self.connected = false;
	self.$element = $element;
	self.reconnectInterval = false;
	self.headers = false;
	self.init = function() {
		if (!window.WebSocket) {
			return;
		} else {
			self.enabled = true;
		}
		self.$element.empty();
		self.$statusElement = $('<span id="status" class="glyphicon glyphicon-transfer" aria-hidden="true"></span>');
		self.$element.append(self.$statusElement);
		self.onStatus(0);
		self.connect();
	}
	self.connect = function() {
		self.onStatus(1);
		self.socket = new WebSocket(wsPath);
		self.socket.onopen = function() {
			self.onStatus(2);
		};
		self.socket.onmessage = self.handleMessage;
		self.socket.onclose = function(e) {
			if (self.reconnectInterval) {
				clearTimeout(self.reconnectInterval);
				self.reconnectInterval = false;
			}
			self.onStatus(3);
			self.reconnectInterval = setTimeout(function() {
				self.connect();
			}, 5000);
		};
		self.socket.onerror = function(err) {
			self.onStatus(4);
			self.socket.close();
		};
	}
	self.onStatus = function(status) {
		if (status == 1) {
			self.$statusElement.css('color', 'orange')
		} else if (status == 2) { 
			self.$statusElement.css('color', 'green')
		} else if (status == 3) { 
			self.$statusElement.css('color', 'red')
		} else if (status == 4) { 
			self.$statusElement.css('color', 'darkred')
		} else {
			self.$statusElement.css('color', 'gray')
		}
	}
	self.send = function() {
		self.socket.send('test');
	}
	self.handleMessage = function(evt) {
		var data = false;
		try {
			data = JSON.parse(evt.data);
		} catch(e) {}
		if (data) self.processRecords(data);

	}
	self.processRecords = function(data) {
		for (var i=0; i< data.length; i++)
			if ('LastTimestamp' in data[i]) data[i]['LastTimestamp'] = parseInt(data[i]['LastTimestamp']) || 0;
		data.sort(function(a, b) {
			if ('LastTimestamp' in a && 'LastTimestamp' in b) {
				return a['LastTimestamp'] - b['LastTimestamp']
			} else {
				return 0;
			}
		})
		for (var i=0; i< data.length; i++) {
			self.processRecord(data[i], recordShowTime * 1000, false);
		}
	}
	self.processRecord = function(record, showTime, isHeader) {
		var name = getAr(record, 'Name', ''),
			number = getAr(record, 'Number', '');
		if ((name=='') || (number == '')) return;
		var $el = $('<div class="list-group-item container-fluid"></div>');
		self.$element.prepend($el);
		if ((isHeader) && (self.headers)) {
			$el.addClass('m-0 p-0 header').hide();
			$el.append($(
				'<div class="col-lg-1">' + self.addHeader('Number') + '</div>' + 
				'<div class="col-lg-3">' + self.addHeader('Name') + '</div>' + 
				'<div class="col-lg-1">' + self.addHeader('Laps') + '</div>' + 
				'<div class="col-lg-2">' + self.addHeader('TotalTime') + '</div>' + 
				'<div class="col-lg-1 text-center">' + self.addHeader('Absolute') + self.addHeader('/') + self.addHeader('CategoryPlace') + '</div>' + 
				'<div class="col-lg-2 text-right">' + self.addHeader('LastLapTime') + '</div>' +
				'<div class="col-lg-2 text-right">' + self.addHeader('Category_m1') + '</div>'
			));
		} else {
			$el.append($(
				'<div class="col-lg-1"><h1>' + number + '</h1></div>' + 
				'<div class="col-lg-3"><h1>' + name + '</h1></div>' + 
				'<div class="col-lg-1"><h1>' + getAr(record, 'Laps', '') + '</h1></div>' + 
				'<div class="col-lg-2"><h3>' + getAr(record, 'TotalTime', '') + '</h3></div>' + 
				'<div class="col-lg-1 text-center"><h1>' + getAr(record, 'Absolute', '') + '/' + getAr(record, 'CategoryPlace', '') + '</h1></div>' + 
				'<div class="col-lg-2 text-right"><h3>' + getAr(record, 'LastLapTime', '') + '</h3></div>' +
				'<div class="col-lg-2 text-right"><h3>' + getAr(record, 'Category_m1', '') + '</h3></div>'
			));
			self.$element.find('.header').show();
		}
		if (showTime > 0) {
			setTimeout(function() {
				$el.fadeOut(showTime * fadeOutProp, function() { 
					$(this).remove(); 
					if (self.$element.find('div.list-group-item:not(.header)').length == 0) self.$element.find('.header').hide();
				});
			}, showTime * (1.0 - fadeOutProp));
		}
		return $el;
	}
	self.close = function() {
		self.socket.close();
	}
	self.setHeaders = function(headers) {
		var wasHeader = self.headers;
		self.headers = headers;
		if (!wasHeader)
			self.processRecord(headers, -1, true);
	}
	self.addHeader = function(name) {
		if (self.headers) {
			if (name in self.headers) {
				return '<span class="label label-default">' + self.headers[name] + '</span>';
			} else {
				return '<span class="label label-default">' + name + '</span>';
			}
		}
		return '';
	}

	self.init();
}

});
