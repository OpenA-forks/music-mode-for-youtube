const { homepage_url } = chrome.runtime.getManifest();
const translated_by    = chrome.i18n.getMessage('translatedBy');

const gVals = {
	siteId: '',
	tabId : -1,
	numChanges: 0,
	has_specific_opts: false
};

const myCont = document.forms.container;

import { optNames, optIcons, sitesInfo, setTheTitles, _cnode, _svgel } from '../pages/setTheTitles.js'

Promise.all([
	chrome.tabs.query({ active: true, currentWindow: true }),
	chrome.storage.local.get()
]).then(([tabs, data]) => {

	if (!tabs.length)
		return;

	let m = /^https?:\/\/(?:www|(music)).(google|youtube).[^\/]+/.exec(tabs[0].url);

	let  tab_id = tabs[0].id;
	let site_id = !m ? 'embedded' : m[2] + (m[1] ? '_'+m[1] : m[2] === 'google' ? '_search' : '');

	const {
		popup_specific_options, sstabs,
		popup_current_page, sspages, enabled
	} = data;

	gVals.tabId  = tab_id;
	gVals.siteId = site_id;
	gVals.has_specific_opts = !!popup_specific_options;

	const tabOpts = document.getElementById('tab_options'),
	     pageOpts = document.getElementById('page_options');

	let t_opts = '', t_enab = '',
	    p_opts = '', p_enab = '';

	if (sstabs && sstabs[tab_id]) {
		t_enab = sstabs[tab_id].enabled ? 1 : 0;
		t_opts = sstabs[tab_id].options;
		showOptions(tabOpts, t_enab);
	}
	for (let sid in sitesInfo) {
		tabOpts.append(
			getSiteItem('stab', sid, t_opts[sid], data, !!popup_specific_options)
		);
	}
	if (popup_current_page && site_id) {
		pageOpts.parentNode.hidden = false;
		if (sspages && sspages[tab_id]) {
			p_enab = sspages[tab_id].enabled ? 1 : 0;
			p_opts = sspages[tab_id].options;
			showOptions(pageOpts, p_enab);
		}
		pageOpts.append(
			getSiteItem('spage', site_id, p_opts[site_id], data, !!popup_specific_options)
		);
	}
	myCont.elements.tab_endis .value = t_enab;
	myCont.elements.page_endis.value = p_enab;
	myCont.elements.mm_enabled.value = enabled ? 1 : 0;
});

myCont.addEventListener('change', onSettingsChange);
myCont.addEventListener('submit', applySettings);

setTheTitles();

if (translated_by) {
	document.getElementById('translatedBy').hidden = false;
	document.getElementById('translatedBy').lastElementChild.textContent = translated_by;
}
// add Browser Specific Links
if (homepage_url.includes('chrome'))
	document.getElementById('support_btn').href = `${homepage_url}/support`;
	document.getElementById( 'review_btn').href = `${homepage_url}/reviews`;

function getSiteItem(pid, sid, dataTab, dataGlob, has_specific_opts) {
	const { fullName, options } = sitesInfo[sid];

	const site_opts = dataTab && dataTab.options,
	    has_site_on = dataTab && !!dataTab.enabled || !!dataGlob[sid];

	const el_item = _cnode('div', { className: 'list-item', title: chrome.i18n.getMessage(`${sid}Tooltip`) });
	const el_opts = _cnode('div', { className: 'list-spec-options' });
	const el_svg  = _svgel('svg', { class: 'bi-ico bi-circle-fill', viewBox: '0 0 16 16' });

	const el_ttl  = _cnode('label', { className: 'it-trigger', htmlFor: `${pid}_${sid}` });
	const el_inp  = _cnode('input', { id: `${pid}_${sid}`, type: 'checkbox',  checked: has_site_on, hidden: true });
	const el_circ = _svgel('circle', { r: '8', cx: '8', cy: '8' });

	el_ttl .append(el_svg, fullName);
	el_svg .append(el_circ);
	el_item.append(el_inp, el_ttl, el_opts);

	if  (has_specific_opts && options)
	for (let o of options) {
		const cls_ico = optIcons[optNames.indexOf(o)],
		      el_ttip = _cnode('div', { className: 'spec-opt', title: chrome.i18n.getMessage(`${o}Tooltip`) }),
		      tip_ico = _svgel('use', { href: `#icon__${cls_ico}` }),
		      tip_inp = el_inp.cloneNode(),
		      tip_txt = el_ttl.cloneNode(),
		      tip_svg = el_svg.cloneNode();

		tip_txt.htmlFor = tip_inp.id = `${pid}_${sid}_${o}`;
		tip_inp.checked = site_opts ? !!site_opts[o] : !!dataGlob[`${sid}_${o}`];
		tip_svg.className = `bi-ico bi-${cls_ico}-fill`;
		tip_txt.append(tip_svg, chrome.i18n.getMessage(o));
		tip_svg.append(tip_ico);
		el_ttip.append(tip_inp, tip_txt);
		el_opts.append(el_ttip);
	}
	return el_item;
}

function getFullSiteOptions(sid, storedGlob, ssObj) {

	const record = ssObj && ssObj.options;
	const { popup_specific_options } = storedGlob;

	const siteObj = {
		enabled: record ? record[sid].enabled : storedGlob[sid]
	};
	if (popup_specific_options && sitesInfo[sid].options) {
		const optsObj = {};
		for (let p of sitesInfo[sid].options) {
			if (record && record[sid].options) {
				optsObj[p] = record[sid].options[p];
			} else {
				optsObj[p] = storedGlob[`${sid}_${p}`];
			}
		}
		siteObj.options = optsObj;
	}
	return siteObj;
}

function onSettingsChange(e) {
	let { name, value, checked } = e.target;

	if (name.endsWith('endis')) {
		name = name.replace('endis', 'options');
		checked = value === '1';
		showOptions(document.getElementById(name), checked);
	}
	myCont.elements.apply_btn.hidden = false;
}

/**
 * @param {Element} el
 * @param {Boolean|Number} v
 */
function showOptions(el, v) {
	if (v) el.classList.add('visible');
	else el.classList.remove('visible');
}

function applySettings(e) {

	e.preventDefault();
	const { tabId, has_specific_opts } = gVals;
	const tabVal = myCont.elements.tab_endis.value,
	     pageVal = myCont.elements.page_endis.value,
	     hasEnab = myCont.elements.mm_enabled.value === '1',
	     sstabs  = tabVal  ? {} : null,
	     sspages = pageVal ? {} : null;

	if (tabVal)
		sstabs[tabId] = applySiteSettings('stab', tabVal === '1', has_specific_opts);
	if (pageVal)
		sspages[tabId] = applySiteSettings('spage', pageVal === '1', has_specific_opts);

	chrome.storage.local.set({ enabled : hasEnab, sstabs, sspages });
	myCont.elements.apply_btn.hidden = true;
}

/**
 * @param {String} pid the name of the tab or page button. tab_endis or page_endis
 * @param {Boolean} has_on perTab or perPage
 * @param {Boolean} has_specific_opts
 */
function applySiteSettings(pid, has_on, has_specific_opts) {

	const ssObj = { enabled: has_on, options: {} };

	for (let sid in sitesInfo) {
		ssObj.options[sid] = {
			enabled: myCont.elements[`${pid}_${sid}`].checked
		}
		if (has_specific_opts && sitesInfo[sid].options) {
			ssObj.options[sid].options = {};
			for (let o of sitesInfo[sid].options)
			ssObj.options[sid].options[o] = myCont.elements[`${pid}_${sid}_${o}`].checked;
		}
	}
	return ssObj;
}
