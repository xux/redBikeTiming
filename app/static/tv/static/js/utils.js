function getCurrentYear() {
	return (new Date()).getFullYear();
}

function hashCode(s){
  return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);              
}

function parseGet(val, def) {
	var result = def,
	tmp = [];
	location.search
	.substr(1)
	.split("&")
	.forEach(function (item) {
		tmp = item.split("=");
		if (tmp[0] === val) result = decodeURIComponent(tmp[1]);
	});
	if (result == 'undefined') result = true;
	return result;
};

function loadJSON(data) {
	try {
		return JSON.parse(data);
	} catch(e) {
		return false;
	}
}


function unpackResponse(data) {
	try {
		return JSON.parse(atob(data));
	} catch(e) {
		return false;
	}
}
function packRequest(data) {
	return btoa(JSON.stringify(data))
}

function getAr(ar, v, d) {
	if (v in ar) {
		return ar[v];
	} else {
		return d;
	}
}

function msToTime(duration) {
    var milliseconds = parseInt((duration%1000)/100)
        , seconds = parseInt((duration/1000)%60)
        , minutes = parseInt((duration/(1000*60))%60)
        , hours = parseInt((duration/(1000*60*60))%24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
}

jQuery.fn.filterByBirthDateAndGender = function($birthDate, $gender) {
	return this.each(function() {
		var select = this;
		var data = JSON.parse($(select).attr('autoselect'));
		function searchData(id) {
			for (var i = 0; i < data.length; i++) {
				if (data[i]['i'] == id)
					return data[i];
			}
		}
		var options = [];
		$(select).find('option').each(function() {
			options.push({value: $(this).val(), text: $(this).text(), data: searchData($(this).val())});
		});
		$(select).data('options', options);
		function onChange() {
			var options = $(select).empty().scrollTop(0).data('options');
			var age = getCurrentYear() - parseInt($.trim($($birthDate).val()).split('.')[2]);
			var male =  $($gender).filter(':checked').val() == 'm';
			$.each(options, function(i) {
				var option = options[i];
				if((option.data !== undefined) && (option.data['m'] == male) &&(option.data['f'] <= age)&&(option.data['t'] >= age)) {
					$(select).append(
						$('<option>').text(option.text).val(option.value)
					);
				}
			});
			$(select).change();
		};
		$($birthDate).bind('change keyup', onChange);
		$($gender).bind('change keyup', onChange);
	});
};

String.prototype.toDateFromDatetime = function() {
//Eg. "2014-04-23 22:06:17".toDateFromDatetime()
	var parts = this.split(/[- :]/);
	d = new Date(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]);
//	d.setTime( d.getTime() - d.getTimezoneOffset()*60*1000 );
	return d;
};
Number.prototype.pad = function(size) {
	return String(this).pad(size);
}
String.prototype.pad = function(size) {
      var s = this;
      while (s.length < (size || 2)) {s = "0" + s;}
      return s;
}

String.prototype.capitalize = function() {
	return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
}

function submit(el) {
	$(el).closest('form').submit();
	return false;
}

function stringDivider(str, width, spaceReplacer) {
    if (str.length>width) {
        var p=width
        for (;p>0 && str[p]!=' ';p--) {
        }
        if (p>0) {
            var left = str.substring(0, p);
            var right = str.substring(p+1);
            return left + spaceReplacer + stringDivider(right, width, spaceReplacer);
        }
    }
    return str;
}

(function($) {
  $.getStylesheet = function (href) {
    var $d = $.Deferred();
    var $link = $('<link/>', {
       rel: 'stylesheet',
       type: 'text/css',
       href: href
    }).appendTo('head');
    $d.resolve($link);
    return $d.promise();
  };
})(jQuery);
