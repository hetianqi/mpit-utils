import axios from 'axios';

var cid = 1;

// 为axio增加jsonp支持
function buildParams(params) {
	var result = [];

	for (var i in params) {
		result.push(encodeURIComponent(i) + '=' + encodeURIComponent(params[i]));
	}

	return result.join('&');
}

function jsonpAdapter(config) {
	return new Promise(function(resolve, reject) {
		var script = document.createElement('script');
		var src = config.url;

		if (config.params) {
			var params = buildParams(config.params);

			if (params) {
				src += (src.indexOf('?') >= 0 ? '&' : '?') + params;
			}
		}

		script.async = true;

		var jsonp = 'axiosJsonpCallback' + cid++;
		var old = window[jsonp];
		var isAbort = false;

		window[jsonp] = function(responseData) {
			window[jsonp] = old;

			if (isAbort) {
				return;
			}
			
			var response = {
				data: responseData,
				status: 200
			};

			resolve(response);
		};

		src += (src.indexOf('?') >= 0 ? '&' : '?') + buildParams({
			[config.jsonpCallback || 'callback']: jsonp, 
			_: (new Date().getTime())
		});

		script.onload = script.onreadystatechange = function() {
			
			if (!script.readyState || /loaded|complete/.test(script.readyState)) {

				script.onload = script.onreadystatechange = null;

				if ( script.parentNode ) {
					script.parentNode.removeChild(script);
				}

				script = null;
			}
		};

		if (config.cancelToken) {
			config.cancelToken.promise.then(function(cancel) {
				if (!script) {
					return;
				}
		
				isAbort = true;
				reject(cancel);
			});
		}        

		script.src = src;

		document.head.appendChild(script);
	});
}

axios.defaults.headers.get['Cache-Control'] = 'no-cache';
axios.defaults.headers.get['If-Modified-Since'] = 0;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

axios.jsonp = axios.create({
	adapter: jsonpAdapter
});

const http = axios.create({
	baseURL: OP_CONFIG.apiUrl,
	withCredentials: true
});

export default http;