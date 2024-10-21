import { setTheTitles, sitesInfo, _cnode, _svgel } from './setTheTitles.js'

const myCont = document.forms.container;
const titles = {
	options : chrome.i18n.getMessage('OptionsTitle'),
	contact : chrome.i18n.getMessage('ContactTitle'),
	about   : chrome.i18n.getMessage(  'AboutTitle'),

	updPage(n = '') {
		const { pathname, hash } = location;
		const o = hash.substring(1) || 'options',
		    ttl = this[n || (n = o)];
		history.replaceState(null, ttl, n === 'options' ? pathname : `#${n}`);
		myCont.classList.remove(`act-${o}`);
		myCont.classList.   add(`act-${n}`);
		document.title = ttl;
	}
};

const qPages = {
	removeQa(field) {
		for(const key of Object.keys(this)) {
			const keys = Object.keys(this[key]);
			if (keys.includes(field))
			if (keys.length === 1)
				delete this[key];
			else
				delete this[key][field];
		}
	}
};

Object.defineProperty(qPages, 'removeQa', { enumerable: false });
titles.updPage(), addTemplates(), setTheTitles();
window.addEventListener('scroll', onScrollChange);
myCont.addEventListener('submit', onApplyChanges);
myCont.addEventListener('click' , onClickElem);
myCont.addEventListener('change', () => {
	onScrollChange();
	myCont.elements.apply_btn.hidden = false;
});

chrome.storage.local.get().then(storedValues => {

	for(const el of myCont.elements) {
		const name = el.id;
		if (name in storedValues)
			el.checked = !!storedValues[name];
	}
	if (storedValues.qapages)
		Object.assign(qPages, storedValues.qapages);
});

function addTemplates() {
	const parent = document.getElementById('site_opts');
	for(const site of Object.keys(sitesInfo)) {
		const opts = sitesInfo[site].options,
			  item = getSiteItem('', site, !!opts),
			  cont = !!opts ? _cnode('div', { className: `setts-opts opt-${site}` }) : '\n';
		if (opts)
			cont.append(...opts.map(o => getSiteItem(`${site}_`, o)));
		parent.append(item, cont);
	}
}

function getSiteItem(gp = '', name = '', lm = false) {
	const sHd = _cnode('div', { className: `${ lm ? 'check-lm ' : '' }setts-head` }),
	     sDsc = _cnode('div', { className: 'setts-desc' }),
	     sItm = _cnode('div', { className: `setts-item h-card${ lm ? ' gp-title' : '' }` }),
	     sTxt = _cnode('div', { className: 'setts-text' }),
	     sBtn = _cnode('div', { className: 'setts-tbtn chex-s1' }),
	     sId  = gp + name;

	sItm.append(sTxt, sBtn); sHd .textContent = chrome.i18n.getMessage(name);
	sTxt.append(sHd , sDsc); sDsc.textContent = chrome.i18n.getMessage(`${name}Description`);
	sBtn.append(
		_cnode('input', { id: sId, type: 'checkbox', hidden: true }),
		_cnode('label', { className: 'b-chk v-on v-off', htmlFor: sId }));
	return sItm;
}

function onClickElem(e) {
	let el = e.target,
	    n = el.dataset.i18n;
	switch (el.classList[0]) {
	case 'check-lm':
		el = el.parentNode;
	case 'check-mk':
		el.parentNode.classList.toggle('u-roll');
		break;
	case 'menu-link':
		if (n !== 'donation') {
			titles.updPage(n);
			break;
		}
	default:
		return;
	}
	e.preventDefault();
}

function onApplyChanges(e) {

	const newVal = {}; e.preventDefault();

	let { id:optName, checked } = e.target;
	switch ( optName ) {
	  case 'popup_current_page':
		newVal.sspages = [];
		break;
	  case 'quick_access_buttons_images':
	  case 'quick_access_buttons_video':
		if (!checked)
			newVal.qapages = qPages.removeQa(optName.substring(optName.lastIndexOf('_')));
	  default:
		newVal[optName] = checked;
		break;
	}
	chrome.storage.local.set(newVal);
	myCont.elements.apply_btn.hidden = true;
}

function onScrollChange() {
	const s = window.innerHeight + Math.floor(window.scrollY) - 45,
	      y = myCont.clientHeight <= s;
	clearTimeout(myCont._t);
	myCont._t = setTimeout(
		y ? () => myCont.classList.add   ('scrl-ed')
		  : () => myCont.classList.remove('scrl-ed')
	, 25);
}