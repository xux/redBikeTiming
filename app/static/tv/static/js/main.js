var pageTop, isFunction, ScrollTo, LoadHighCharts, HighChartsPrepareData, LoadJSTree, autoCompleteData, api, setURL;
$(function() {

function getFrameElement() {
	try {
		var iframes = parent.document.getElementsByTagName('iframe');
		for (var i=iframes.length; i-->0;) {
			var iframe= iframes[i];
			try {
				var idoc= 'contentDocument' in iframe? iframe.contentDocument : iframe.contentWindow.document;
			} catch (e) {
				continue;
			}
			if (idoc===document)
				return iframe;
		}
	} catch(e){};
	return null;
}
function resizeIframe(obj) {
	if (obj == null) return;
	$(obj).height($('html').height());
}
var iframe = getFrameElement();
$( document ).ready(function() {
	resizeIframe(iframe);
});
$(window).resize(function(){
	resizeIframe(iframe);
});


pageTop = function(){
	if (iframe !== null) {
		return $(iframe).closest('body').find(".navbar-fixed-top").height();
	} else {
		return $(".navbar-fixed-top").height();
	}
}
isFunction = function(functionToCheck) {
	var getType = {};
	return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}

ScrollTo = function($el) {
	if ($el != 0) {
		try {
			if ($el.length > 0) $('html, body').scrollTop($el.offset().top - pageTop()).scroll();
		} catch(e){};
	} else {
		$('html, body').scrollTop(0).scroll();
	}

}

setURL = function(url) {
	if (url == '') url ='/';
	try {
		window.history.replaceState({}, '', url);
	} catch(e) {console.log(e);}
}



var highChartLoaded = false;
LoadHighCharts = function(onLoadFunc) {
	if (!highChartLoaded) {
		$.getScript( "https://code.highcharts.com/highcharts.js", function(){
			$.getScript( "http://code.highcharts.com/modules/exporting.js", function() {
			$.getScript( "/tv/static/js/highcharts-utils.js", function() {
				Highcharts.Renderer.prototype.symbols.cross = function (x, y, radius) {
				    var r = radius * 0.4,
				        e = r * 0.8,
				        a = e / Math.sqrt(2),
				        p = r / Math.sqrt(2);
				    return [
				        'M', x, y + a,
				        'L', x + p, y + a + p,
				        x, y + a + (2 * p),
				        x + a, y + (2 * a) + (2 * p),
				        x + a + p, y + (2 * a) + p,
				        x + a + (2 * p), y + (2 * a) + (2 * p),
				        x + (2 * a) + (2 * p), y + a + (2 * p),
				        x + (2 * a) + p, y + a + p,
				        x + (2 * a) + (2 * p), y + a,
				        x + a + (2 * p), y,
				        x + a + p, y + p,
				        x + a, y,
				        'Z'];
				};
				highChartLoaded = true;
				onLoadFunc();
			});
			});
		});
	} else {
		onLoadFunc();
	}
}
HighChartsPrepareData = function(data, toSort) {
	r = [];
	for (var k in data) 
		r.push([k, data[k]]);
	if (toSort) {
		r.sort(function(a, b) {
			return b[1] - a[1];
		});
	}
	return r;
}

var JSTreeLoaded = false;
LoadJSTree = function(onLoadFunc) {
	if (!JSTreeLoaded) {
		$.when($.getStylesheet('/tv/static/libs/jstree/themes/default/style.min.css'), $.getScript('/tv/static/libs/jstree/jstree.min.js')).then(function(){
				JSTreeLoaded = true;
				onLoadFunc();
			});
	} else {
		onLoadFunc();
	}
}

autoCompleteData = function(field, create, onSelectFunc) {
	return {
		source: function(request, response){
			$.ajax({
				url: "/api/?action=autocomplete&field=" + field + '&create=' + create,
				dataType: "jsonp",
				success: function( data ) {
					response( data );
				},
				data: {
					term: request.term
				},				
			});
		},
		delay: 100,
		minLength: 1,
		focus: function( event, ui ) {
			event.preventDefault();
			return false;
		},
		select: function( event, ui ) {
			event.preventDefault();
			if (typeof onSelectFunc === 'function') onSelectFunc(ui);
			return false;
		},
	}
}

api = function(urlParams, data, onSuccess) {
	$.ajax({
		url: "/api/?" + urlParams,
		dataType: "jsonp",
		success: onSuccess,
		data: data,
	});
}

var $b2t = $('#back2top');
if ($b2t.length > 0) {
	$b2t.click(function(e){
		e.preventDefault();
		ScrollTo(0);
	});
	$(window).scroll(function(){
		if ($('html, body').scrollTop() > 0 ) {
			$b2t.show();
		} else {
			$b2t.hide();
		}
	});
};

$('.btn-share').click(function(e){
	e.preventDefault();
	window.open($(this).attr('href'),'', 'toolbar=0,status=0,width=626,height=436');
});

});


$(document).ready(function() {
	$('.collapse').on('shown.bs.collapse', function (e) {
		$(window).scroll();
	});
	$('.collapse.will_close').collapse('hide');

	var $locationHash = $(decodeURIComponent(location.hash));
	$locationHash.closest('.collapse').collapse();
	ScrollTo($locationHash);
	$(window).scroll();



function readURL(input) {
	if (input.files && input.files[0]) {
		var reader = new FileReader();
		reader.onload = function (e) {
			$(input).closest('.fieldWrapper').find('img').attr('src', e.target.result);
		}
		reader.readAsDataURL(input.files[0]);
	}
}
if ($('.fieldWrapper img').attr('src') == '')
	$('.fieldWrapper .img').addClass('empty');

$('.fieldWrapper input[type="file"]').change(function(){
	readURL(this);
	$(this).closest('.fieldWrapper').find('.img').removeClass('empty');
})
$('.fieldWrapper button.btn_set').click(function(e){
	e.preventDefault();
	var $fW = $(this).closest('.fieldWrapper');
	$fW.find('input[type="file"]').focus().trigger("click");
	$fW.find('input[type="checkbox"]').prop( "checked", false );
});
$('.fieldWrapper button.btn_clear').click(function(e){
	e.preventDefault();
	var $fW = $(this).closest('.fieldWrapper');
	$fW.find('input[type="checkbox"]').prop( "checked", true );
	$fW.find('input[type="file"]').val('');
	$fW.find('img').attr('src', '');
	$fW.find('.img').addClass('empty');
});

$('.tokenfield').each(function(){
	var $this = $(this);
	$this.tokenfield({
		delimiter: "<|>", 
		autocomplete: autoCompleteData($this.attr('id').replace('id_', ''), true),
		showAutocompleteOnFocus: true,
		createTokensOnBlur: true
	}).on('tokenfield:createtoken', function (event) {
		if (event.attrs.label === event.attrs.value)
			event.attrs.value = '_' + event.attrs.value;

		var existingTokens = $(this).tokenfield('getTokens');
		$.each(existingTokens, function(index, token) {
			if (token.value === event.attrs.value)
				event.preventDefault();
		});
	});
});

$('.select-none').click(function(e){
	e.preventDefault();
	var $this = $(this);
	$this.closest('form').find('input[name="' + $this.data('target') + '"]').prop('checked', false);

});
$('.select-all').click(function(e){
	e.preventDefault();
	var $this = $(this);
	$this.closest('form').find('input[name="' + $this.data('target') + '"]').prop('checked', true);

});

$('#id_category.filtered').filterByBirthDateAndGender($('#id_birthDate'), "input[name=gender]");

if (history.length > 1) {
	$('.btn-back').each(function(){
		$(this).find('button').click(function(){history.go(-1);});
		$(this).show();
	});
}

function toggleCollapseIcon(e) {
	$(e.target)
		.prev('.panel-heading')
		.find(".more-less")
		.toggleClass('glyphicon-plus glyphicon-minus');
	$(e.target).find('iframe').each(function(){
		if ($(this).attr('longdesc')) {
			$(this).attr('src', $(this).attr('longdesc'));
			$(this).attr('longdesc', '');
		}
			
	});
	$(window).resize();
}
$('.panel-group').on('hidden.bs.collapse', toggleCollapseIcon);
$('.panel-group').on('shown.bs.collapse', toggleCollapseIcon);
$('[data-toggle="tooltip"]').tooltip();

$('form#pay').submit(function(e){
	$('.pay-block').hide();
	$('.pay-update').css('display', 'block');
});
$("img.lazy").show().lazyload({threshold : 200});
/*****************************/
while(CMDs.length > 0) {  
	CMDs.pop()();
}  

});
