
const optNames  = Object.freeze(['video', 'thumbnails', 'avatars', 'adblocker', 'other_images']);
const optIcons  = Object.freeze(['play', 'image', 'person', 'shield', 'images']);
const sitesInfo = Object.freeze({
	youtube: {
		fullName: chrome.i18n.getMessage('youtube'),
		options: optNames
	},
	youtube_music: {
		fullName: chrome.i18n.getMessage('youtube_music'),
		options: optNames
	},
	embedded: {
		fullName: chrome.i18n.getMessage('embedded'),
		options: optNames.slice(0,-1)
	},
	google_search: {
		fullName: chrome.i18n.getMessage('google_search_full'),
		options: null
	}
});

const _cnode = (tag, attrs) => Object.assign(document.createElement(tag), attrs);
const _svgel = (tag, attrs) => {
	const svg = document.createElementNS('http://www.w3.org/2000/svg', tag);
	for (let key in attrs)
		svg.setAttribute(key, attrs[key]);
	return svg
}

const setTheTitles = () => {
	const parser = new DOMParser;

	fetch(chrome.runtime.getURL('/img/symbols.svg')).then(
		r => r.ok ? r.text() : Promise.reject()
	).then(xml => {
		const svg = parser.parseFromString(xml, 'image/svg+xml').documentElement;
		svg.setAttribute('hidden', '');
		document.body.append(svg);
	});

	for (let el of document.querySelectorAll('[data-i18n], [data-title]')) {

		const { i18n:text, title } = el.dataset;

		if (title)
			el.title = chrome.i18n.getMessage(title);
		if (text) {
			const str = chrome.i18n.getMessage(text);
			if (/<\/\w+>/.test(str)) {
				el.textContent = '';
				el.append(...parser.parseFromString(str, 'text/html').body.childNodes);
			} else
				el.textContent = str;
		}
	}
}

export {
	optNames, optIcons, sitesInfo, setTheTitles, _svgel, _cnode
};
