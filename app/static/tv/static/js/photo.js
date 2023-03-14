var is_staff = false;
function submitForm(btn, onOk) {
	var form = $(btn).closest('form');
	$.ajax({
		type: form.attr('method'),
		url: form.attr('action'),
		data: form.serialize(),
		success: function (data) {
			if (typeof(onOk) ==='function') onOk();
		}
	});
};
function setUrl(url) {
	var scrollV, scrollH;
	if (history && history.replaceState) {
		history.replaceState({}, "", url);
	} else { 
		scrollV = document.body.scrollTop;
		scrollH = document.body.scrollLeft;
		location.hash = url;
		document.body.scrollTop = scrollV;
		document.body.scrollLeft = scrollH;
	}
};

function SumbitNumbersChange(btn) {
	submitForm(btn, function(){ 
		var s = $(btn).closest('span');
		$($.magnificPopup.instance.currItem.el[0]).attr('data-numbers', s.find('#numbers').val());
		$.magnificPopup.instance.st.callbacks.updateStatus();
	});
}
function EditNumbersClick(span, id, numbers) {
	var $el = $(span).parent().find('#PhotoNumbers');
	$el.html('<form action="/api/"><input type="hidden" name="action" value="apn"><input type="hidden" name="id" value="' + id + '"><input type="text" id="numbers" name="numbers" value="' + numbers + '"><input type="submit" value="Ok" onclick="SumbitNumbersChange(this); return false;"></form>');
	$el.find('#numbers').focus();
	return $el.find('form :submit');
}
$(document).ready(function() {
	var OriginalUrl = '';
	$('.zoom-gallery').magnificPopup({
		delegate: 'a.thumbnail',
		type: 'image',
		closeOnContentClick: false,
		closeBtnInside: false,
		mainClass: 'mfp-no-margins mfp-with-zoom mfp-img-mobile',
		image: {
			verticalFit: true,
			titleSrc: function(item) {
				var editText = '';
				if (item.el.attr('data-numbers-edit'))
					editText = ' ondblclick="EditNumbersClick(this, \'' + item.el.attr('data-id') + '\', \'' + item.el.attr('data-numbers') + '\');"'
				var r = item.el.attr('title');
				if (r != '') r += '&nbsp;&middot;&nbsp;';
				if (item.el.attr('data-link') != '') 
					r += '<a class="white-link" href="'+item.el.attr('data-link')+'" target="_blank">Источник</a>';
				if (r != '') r += '&nbsp;&middot;&nbsp;';
				r += '<a class="white-link" href="'+item.el.attr('data-source')+'" target="_blank">Полный размер</a>';
				if (r != '') r += '&nbsp;&middot;&nbsp;';
				r += 'Гонщики на фото:  <span' + editText + ' id="PhotoNumbers">';
				if (item.el.attr('data-numbers'))
					 r += item.el.attr('data-numbers')
				else
					 r += '--';
				r += '</span>';
				if (item.el.attr('data-me'))
					 r += '<a class="edit white-link" href="#" onclick="SumbitNumbersChange(EditNumbersClick(this, \'' + item.el.attr('data-id') + '\', \'' + item.el.attr('data-numbers') +';' + item.el.attr('data-me') + '\')); return false;">(я есть на фото)</a> ';
				if (item.el.attr('data-numbers-edit'))
					 r += '<a class="edit white-link" href="#" onclick="EditNumbersClick(this, \'' + item.el.attr('data-id') + '\', \'' + item.el.attr('data-numbers') + '\');return false;">(нажмите для ввода номеров на фото)</a>';
				r = '<div style="display:none" id="zoom-gallery-title-wrapper">' + r + '</div>';
				return r
			}
		},
		callbacks: {
			updateStatus: function() {
			try {
				$($.magnificPopup.instance.content).find('img').wrap('<div id="zoom-img"></div>');
				$('#zoom-img').trigger('zoom.destroy');
				$('#zoom-img').zoom({on:'grab'})

				var text = $("#PhotoNumbers").text();
				if (text == '')
					text = $("#PhotoNumbers").find('#numbers').val();
				if (typeof(text) === 'undefined') text = '';
				if (OriginalUrl === '') OriginalUrl = location.origin + location.pathname + $.query.REMOVE('view');
				setUrl(location.pathname + $.query.set('view', $($.magnificPopup.instance.currItem.el[0]).data('id')));
				if (text == '--' || text == '') {
					if (is_staff) $("#PhotoNumbers").dblclick();
					return;
				};
				var nums = text.split(/[;,.:\s]+/),
					t = '',
					link_base = $($.magnificPopup.instance.currItem.el[0]).attr('data-photo-link');
				for (var i = 0 ; i < nums.length; i++)
					if (nums[i] != '') {
						if (t != '')
							t += ', ';
						t += '<a class="white-link" target="_blank" href="' + link_base + '/' +  nums[i] + '">' + nums[i] + '</a>';
					}
				t += '&nbsp;&nbsp;&nbsp;';
				$("#PhotoNumbers").html(t);
			} finally {
				$('#zoom-gallery-title-wrapper').show();
			}
			},
			beforeClose: function() {
				ScrollTo($($.magnificPopup.instance.currItem.el[0]));
				setUrl(OriginalUrl);
				OriginalUrl = '';

			},
		},
		gallery: {
			enabled: true
		},
		zoom: {
			enabled: true,
			duration: 300,
			opener: function(element) {
				return element.find('img');
			}
		}
		
	});
	var view_id = $.query.get('view');
	if (view_id !== '')
	{	
		var $view_el = $('#id' + view_id)
		$view_el.closest('.collapse').collapse();
		$view_el.click();
	}
});
