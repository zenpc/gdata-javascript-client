// Google Calendar Events in Gmail
//
// Copyright (c) 2007 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// -------------------------------------------------------------------- 
// This is a Greasemonkey user script.
//
// To install, you need Greasemonkey: http://greasemonkey.mozdev.org/
// Then restart Firefox and revisit this script.
// Under Tools, there will be a new menu item to "Install User Script".
// Accept the default configuration and install.
//
// To uninstall, go to Tools/Manage User Scripts,
// select "Google Calendar Events in Gmail", and click Uninstall.
//
// --------------------------------------------------------------------
// ==UserScript==
// @name          Google Calendar Events in Gmail
// @namespace     http://mail.google.com
// @description   Displays your next 3 Google Calendar Events in Gmail
// @include       http://mail.google.com/mail/*
// @include       https://mail.google.com/mail/*
// @exclude       http://mail.google.com/mail/help/*
// @exclude       https://mail.google.com/mail/help/*
// ==/UserScript==

/**
 * Loads the calendar and sets a timer to continue refreshing calendar 
 * on a specified interval 
 *
 * @param {string} calendarUrl is the URL for a calendar feed
 * @param {int} interval is the interval in milliseconds between each refresh
 */
function refreshCalendarLoop(calendarUrl, interval) {
  loadCalendar(calendarUrl);
  window.setTimeout(
      function () {
        refreshCalendarLoop(calendarUrl, interval); 
      },
      interval);
}

/**
 * Uses GData JS Client Library to retrieve a calendar feed from the specified
 * URL.  The feed is controlled by several query parameters and a callback 
 * function is called to process the feed results.
 *
 * @param {string} calendarUrl is the URL for a calendar feed
 */  
function loadCalendar(calendarUrl) {
  var service = new GDataGoogleService('apps', 
      'gdata-js-client-samples-calendar-in-gmail');
  var query = new GDataQuery(calendarUrl);
  query.setParam('orderby', 'starttime');
  query.setParam('sortorder', 'ascending');
  query.setParam('futureevents', 'true');
  query.setParam('singleevents', 'true');
  query.setParam('max-results', '3');
  // call getFeed with the URI of the feed to be retrieved,
  // the callback function on success (listEvents), 
  // and the callback function on error (handleGDError)
  service.getFeed(query.getUri(), listEvents, handleGDError);
}

/**
 * Callback function if an error occurs reading the calendar feed
 *
 * @param {Error} e is an instance of an Error
 */
function handleGDError(e) {
  if (e instanceof Error) {
    // alert with the error line number, file and message
    GM_log('Error at line ' + e.lineNumber +
          ' in ' + e.fileName + '\n' +
          'Message: ' + e.message);
    // if available, output HTTP error code and status text
    if (e.cause) {
      var status = e.cause.status;
      var statusText = e.cause.statusText;
      GM_log('Root cause: HTTP error ' + status + ' with status text of of: ' +
             statusText);
    }
  } else {
    GM_log(e.toString());
  }
}

/**
 * Callback function for the GData JS Client Library to call with a feed of
 * events retrieved.
 *
 * Adds a table cell to the Gmail interface.  The table cell gets added as
 * a sibling to the mt_advParent global variable.
 *
 * @param {json} feedRoot is the root of the feed, containing all entries 
 */ 
function listEvents(feedRoot) {
  var entries = feedRoot.feed.entry;
  // there were no calendar entries returned
  if (entries == null) {
    GM_log('No calendar entries returned');
    return;
  }
  // create a new eventContainer td element if on first run, else
  // use existing td
  var eventContainer = document.getElementById('eventsInGmail') ?
      document.getElementById('eventsInGmail') : document.createElement('td');
  // clear out any data previously in td
  while (eventContainer.childNodes.length > 0) {
      eventContainer.removeChild(eventContainer.childNodes[0]);
  }
  // set the id of the td to eventsInGmail
  eventContainer.setAttribute('id', 'eventsInGmail');
  // adjust several properties to improve design 
  eventContainer.setAttribute('width', '200%');
  mt_advParent.parentNode.childNodes['0'].setAttribute('valign', 'middle');
  mt_advParent.removeAttribute('width');
  mt_advParent.setAttribute('width', '100');
  // create an unordered list to store events
  var ul = document.createElement('ul');
  // for each of the events in the feed
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    var title = entry.title.$t;
    var start = entry.gd$when.startTime;
    var entryLinkHref;
    // find the link that represents the html webpage for the event
    for (var linki = 0; linki < entry.link.length; linki++) {
      if (entry.link[linki].type == 'text/html' &&
          entry.link[linki].rel == 'alternate') {

          entryLinkHref = entry.link[linki].href;
      }
    }
    // format the event into a human-readable form
    var dateString = formatGCalTime(start);
    var li = document.createElement('li');
    // change the size of the font for the list items
    li.setAttribute('style', 'font-size: 75%');
    // if we found a link to the html webpage, create a link on the title
    if (typeof entryLinkHref != 'undefined') {
      entryLink = document.createElement('a');
      entryLink.setAttribute('href', entryLinkHref);
      // open link in new window
      entryLink.setAttribute('target', '_blank');
      entryLink.appendChild(document.createTextNode(title));
      li.appendChild(entryLink);
      li.appendChild(document.createTextNode(' - ' + dateString));
    } else {
      // no URL to link to -- just output the plain text
      li.appendChild(document.createTextNode(title + ' - ' + dateString));
    }
    // append the list item to the list created
    ul.appendChild(li);
  }
  // add the unordered list to the table cell
  eventContainer.appendChild(ul);
  // add the table cell (eventContainer) to the table row
  mt_advParent.parentNode.appendChild(eventContainer);
}


/**
 * Converts an xs:date or xs:dateTime formatted string into the local timezone
 * and outputs a human-readable form of this date or date/time.
 *
 * @param {string} gCalTime is the xs:date or xs:dateTime formatted string
 * @return {string} is the human-readable date or date/time string
 */
function formatGCalTime(gCalTime) { 
  // text for regex matches
  var remtxt = gCalTime;

  function consume(retxt) {
    var match = remtxt.match(new RegExp('^' + retxt));
    if (match) {
      remtxt = remtxt.substring(match[0].length);
      return match[0];
    }
    return '';
  }

  // minutes of correction between gCalTime and GMT
  var totalCorrMins = 0;

  var year = consume('\\d{4}');
  consume('-?');
  var month = consume('\\d{2}');
  consume('-?');
  var dateMonth = consume('\\d{2}');
  var timeOrNot = consume('T');

  // if a DATE-TIME was matched in the regex 
  if (timeOrNot == 'T') {
    var hours = consume('\\d{2}');
    consume(':?');
    var mins = consume('\\d{2}');
    consume('(:\\d{2})?(\\.\\d{3})?');
    var zuluOrNot = consume('Z');

    // if time from server is not already in GMT, calculate offset
    if (zuluOrNot != 'Z') {
      var corrPlusMinus = consume('[\\+\\-]');
      if (corrPlusMinus != '') {
        var corrHours = consume('\\d{2}');
        consume(':?');
        var corrMins = consume('\\d{2}');
        totalCorrMins = (corrPlusMinus=='-' ? 1 : -1) * 
            (Number(corrHours) * 60 + 
	    (corrMins=='' ? 0 : Number(corrMins)));
      }
    } 

    // get time since epoch and apply correction, if necessary
    // relies upon Date object to convert the GMT time to the local
    // timezone
    var originalDateEpoch = Date.UTC(year, month - 1, dateMonth, hours, mins);
    var gmtDateEpoch = originalDateEpoch + totalCorrMins * 1000 * 60;
    var ld = new Date(gmtDateEpoch);

    // date is originally in YYYY-MM-DD format
    // time is originally in a 24-hour format
    // this converts it to MM/DD hh:mm (AM|PM) 
    dateString = (ld.getMonth() + 1) + '/' + ld.getDate() + ' ' + 
        ((ld.getHours() > 12) ? (ld.getHours() - 12) : (ld.getHours() === 0
        ? 12 : ld.getHours())) + ':' + ((ld.getMinutes() < 10) ? ('0' + 
	ld.getMinutes()) : (ld.getMinutes())) + ' ' + 
	((ld.getHours() >= 12) ? 'PM' : 'AM');
  } else {
    // if only a DATE was matched
    dateString =  parseInt(month) + '/' + parseInt(dateMonth);
  }
  return dateString;
}


// GData JavaScript Client Library
var G=encodeURIComponent,E=Array;function v(a,b){return a.type=b}var H="childNodes",Q="nodeName",P="attributes",s="length",t="status",K="type",J="port",_P="prototype",B="responseText",I="location";if(typeof framework=="undefined"){framework=undefined}var n=framework?null:this,google={};google.gdata={};Function[_P].bind=function(a,b){return l.bind.apply(null,[this,a].concat(E[_P].slice.call(arguments,1)))};var l={};google.gdata.util=l;l.bind=function(a,b,c){var d=a.D||[];d=d.concat(E[_P].slice.call(arguments,2));if(a.r){b=a.r}if(a.p){a=a.p}var e=function(){var g=d.concat(E[_P].slice.call(arguments));return a.apply(b,g)};e.D=d;e.r=b;e.p=a;return e};var ba=function(a){return typeof a=="string"?a.replace(/^ */g,"").replace(/ *$/g,""):a};l.trim=ba;var qa=function(a){if(m[K]==sa){var b=new DOMDocument;
b.loadXML(a);return b}else if(m.isIe){var b=new ActiveXObject("Microsoft.XMLDOM");b.async=false;b.loadXML(a);return b}else if(typeof n.DOMParser!="undefined"){var c=new DOMParser;return c.parseFromString(a,"text/xml")}else{throw new Error("runtime not supported");}};l.convertXmlTextToDom=qa;var Y=function(a){a=ba(a);if(a[s]==0)return null;var b=qa(a);return oa(b)};l.convertXmlTextToJavaScript=Y;var oa=function(a){if(m.isIe){var b=a.lastChild,c=O(b),d={},e=a.firstChild[P];for(var g=0;g<e[s];g++){var h=
e[g];d[h[Q]]=h.nodeValue}d[b[Q]]=c;return d}else{var b=a.documentElement,c=O(b),d={version:a.xmlVersion||"1.0",encoding:a.xmlEncoding||"UTF-8"};d[c.channel?"rss":b[Q]]=c;T(c);return d}};l.convertDomToJavaScript=oa;var O=function(a){var b={};if(a[P])for(var c=0;c<a[P][s];c++){var d=a[P][c],e=d[Q].replace(/:/g,"$"),g=d.nodeValue;if(e.indexOf("_moz-")<0){b[e]=g}}if(a[H][s]==1&&a[H][0].nodeType==3){b.$t=a[H][0].nodeValue}else{for(var c=0;c<a[H][s];c++){var h=a[H][c];if(h.nodeType!=3){var e=h.tagName;
e=e.replace(/:/g,"$");var i=b[e];if(i){if(!(i instanceof E)){b[e]=[b[e]]}b[e].push(O(h))}else{var r=O(h);if(e=="entry"){b[e]=[r]}else{b[e]=r}}}}}return b};l.M=O;var pa=function(a){a=ba(a);if(a[s]==0)return null;var b=a.replace(/\r/g,"\\r"),c=b.replace(/\n/g,"\\n"),d=eval("("+c+")");T(d.feed||d.entry);return d};l.convertJsonTextToJavaScript=pa;var X=function(a){var b="<?xml version='"+(a.$version||"1.0")+"' encoding='"+(a.$encoding||"UTF-8")+"' ?>";return b+U("entry",a)};l.convertEntryToAtom=X;var U=
function(a,b){var c="<"+a;for(var d in b){if(d.indexOf("$")!=0){var e=b[d];if(typeof e!="object"){d=d.replace(/\$/g,":");c+=" "+d+"='"+(e?e.toString():e)+"'"}}}c+=">";for(var d in b){if(d.indexOf("$")!=0){var e=b[d];if(typeof e=="object"){d=d.replace(/\$/g,":");if(e instanceof E){for(var g=0;g<e[s];g++){c+=U(d,e[g])}}else{c+=U(d,e)}}}}if(b.$t){c+=b.$t}c+="</"+a+">";return c};l.convertJavaScriptToAtom=U;var T=function(a){for(var b in a){var c=a[b];if(b.indexOf("xmlns")==0){var d=b=="xmlns"?"":b.substring("xmlns$"[s]);
if(!a.$ns)a.$ns={};a.$ns[d]=c;if(!a.$rns)a.$rns={};a.$rns[c]=d}}};l.buildNamespaceDictionaries=T;l.getEntryLink=function(a,b){var c=a.link;if(c){for(var d=0;d<c[s];d++){var e=c[d];if(e.rel==b){return e.href}}}return null};var ra=function(a){return a!=null&&typeof a=="object"};l.isObject=ra;l.isArray=function(a){return a instanceof E||ra(a)&&$(a.join)&&$(a.reverse)};var $=function(a){return typeof a=="function"};l.isFunction=$;var Z=function(a){var b={};for(var c in a){b[c]=a[c]}return b};l.copy=Z;
l.log=function(){if(n.console){n.console.log.apply(this,arguments)}};var aa=function(a,b){return a.indexOf("google.com/"+b+"/")>0};l.isService=aa;var m={};google.gdata.runtime=m;var na=function(){var a=m;if(typeof framework=="object"&&framework.graphics){v(a,a.TYPE.GD);a.isIe=true;return}if(typeof n._IG_Prefs=="function"){v(a,a.TYPE.IG);a.detectBrowser();return}if(typeof n.widget=="function"&&n.widget.identifier&&typeof n.widget.openApplication=="function"){v(a,a.TYPE.MD);a.isSafari=true;a.isKhtml=true;return}if(typeof n.GM_xmlhttpRequest=="function"){v(a,a.TYPE.GM);a.isGecko=true;return}if(typeof n.konfabulatorVersion=="function"){v(a,a.TYPE.KF);
return}v(a,a.TYPE.UP);a.detectBrowser()};m.detect=na;m.detectBrowser=function(){var a=navigator.userAgent,b=m;b.isOpera=typeof opera!="undefined";b.isIe=!b.isOpera&&a.indexOf("MSIE")!=-1;b.isSafari=!b.isOpera&&a.indexOf("Safari")!=-1;b.isGecko=!b.isOpera&&navigator.product=="Gecko"&&!b.isSafari;b.isKonqueror=!b.isOpera&&a.indexOf("Konqueror")!=-1;b.isKhtml=b.isKonqueror||b.isSafari};var N={MD:"Mac OS X Dashboard",GM:"GreaseMonkey",GD:"Google Desktop",IG:"Google Personalized Start Page",KF:"Yahoo Widget Engine",
UP:"Unprivileged"},sa=N.GD,ta=N.GM,ua=N.IG,ma=N.UP;m.TYPE=N;na();var u={};google.gdata.net=u;u.status={OK:200,NOT_OK:300,BAD_REQUEST:400,FORBIDDEN:403,PRECONDITION_FAILED:412};var M=function(a){var b=function(d){return"string"==typeof d&&d[s]>0?d:null},c=a.match(ja);if(c){this.scheme=b(c[1]);this.credentials=b(c[2]);this.domain=b(c[3]);this.port=b(c[4]);this.path=b(c[5]);this.query=b(c[6]);this.fragment=b(c[7])}};u.Uri=M;var ja=/^(?:([^:\/?#]+):)?(?:\/\/(?:([^\/?#]*)@)?([^\/?#:@]*)(?::([0-9]+))?)?([^?#]+)?(?:\?([^#]*))?(?:#(.*))?$/;M.L=ja;var ka=function(a,b){var c=new M(a),d=new M(b);return(c.domain==null||c.domain==d.domain)&&(c[J]==null||c[J]==d[J])};M.hasSameOriginAs=
ka;var la={};u.xmlHttpRequest=la;var W=function(a,b,c,d,e,g){if(m[K]==ta){GM_xmlhttpRequest({method:a,url:b,headers:d,data:c,onload:function(p){e(p,g)},onerror:g});return}var h=m.isIe?new ActiveXObject("Microsoft.XMLHTTP"):new XMLHttpRequest;try{h.open(a,b,true)}catch(i){if(typeof i=="string"){i=new Error(i)}if(g){return g(i)}else{throw i;}}h.onreadystatechange=function(p){if(h.readyState==4){e(h,g)}};if(d){for(var r in d){var j=d[r];h.setRequestHeader(r,j)}}try{h.send(c||null)}catch(i){if(typeof i==
"string"){i=new Error(i);i.cause=h}if(g){return g(i)}else{throw i;}}};la.sendAsyncRequest=W;var S=function(){var a=o.alt;this.a={};this.a[a.ATOM]=a.ATOM;this.a[a.RSS]=a.RSS;this.a[a.JSON]=a.JSON};u.XmlHttpRequestTransport=S;S[_P].e=function(a){return this.a[a]};S[_P].z=function(a,b,c,d,e,g,h,i){b=b+(b.indexOf("?")>0?"&":"?")+"alt="+c;if(aa(b,"base")){if(g.developerKey){b+="&key="+g.developerKey}}b+="&user-agent=gssn-"+g.sessionId;W(a,b,d,e,h,i)};var D=function(){var a=o.alt;this.a={};this.a[a.ATOM]=a.ATOM_IN_SCRIPT;this.a[a.RSS]=a.RSS_IN_SCRIPT;this.a[a.JSON]=a.JSON_IN_SCRIPT};u.ScriptTagTransport=D;D.J=0;var L={};D.N=L;var ia=function(a,b){var c=b||0,d="req"+c,e=L[d];if(e){delete L[d];return e.continuation.call(e.self,a)}else{throw new Error('script request "'+c+'" not found');}};D.handleScriptLoaded=ia;var gdata={io:{handleScriptLoaded:ia}};D[_P].e=function(a){return this.a[a]};D[_P].z=function(a,b,c,d,e,g,h,i){var r=++google.gdata.net.ScriptTagTransport.J,
j=n.document.createElement("script");b=b+(b.indexOf("?")>0?"&":"?")+"alt="+c+"&reqid="+r;if(aa(b,"base")){if(g.developerKey){b+="&key="+g.developerKey}}b+="&user-agent=gssn-"+g.sessionId;j.src=b;if(i){if(m.isIe){j.onreadystatechange=function(){switch(this.readyState){case "loading":j.loadingSeen=true;break;case "interactive":j.interactiveSeen=true;break;case "loaded":break}}}else{j.onerror=function(p){h({status:400,statusText:p},i)}}}j.continuation=function(p){n.document.body.removeChild(j);T(p.feed||
p.entry);h({status:200,responseText:p},i)};j.self=g;L["req"+r]=j;L.req0=j;n.document.body.appendChild(j)};var o={};google.gdata.client=o;o.alt={};var z="atom";o.alt.ATOM=z;var ea="atom-in-script";o.alt.ATOM_IN_SCRIPT=ea;var ga="rss";o.alt.RSS=ga;var ha="rss-in-script";o.alt.RSS_IN_SCRIPT=ha;var A="json";o.alt.JSON=A;var fa="json-in-script";o.alt.JSON_IN_SCRIPT=fa;var y=function(a){this.c=a};o.Authenticator=y;y[_P].f=function(){throw new Error("subclass responsibility");};y[_P].d=function(a,b){throw new Error("subclass responsibility");};y[_P].k=function(a){throw new Error("subclass responsibility");};var F=function(a){y.call(this,a)};o.NullAuthenticator=F;F.prototype=new y(null);F[_P].d=function(a){a()};F[_P].f=function(){return false};F[_P].k=function(){};var w=function(a){y.call(this,a)};o.ClientLoginAuthenticator=w;w.prototype=new y(null);w[_P].d=function(a,b){if(!this.c.username||!this.c.password){throw new Error("need username and password in service for authentication");}var c="Email="+G(this.c.username)+"&Passwd="+G(this.c.password)+"&source="+G(this.c.applicationName)+"&service="+G(this.c.serviceName)+(this.c.accountType?"&accountType="+this.c.accountType:"");W("POST",this.G(),c,{"content-type":"application/x-www-form-urlencoded"},this.F(a,
b),b)};w[_P].f=function(){return this.c.username&&!this.l};w[_P].n="/accounts/ClientLogin";w[_P].G=function(){if(m[K]!=ma){return"https://www.google.com"+this.n}else{return n[I].protocol+"//"+n[I].host+(n[I][J]?":"+n[I][J]:"")+this.n}};w[_P].F=function(a,b){var c=this;return function(d){var e=da;if(d[t]==u[t].FORBIDDEN){var g=new Error("Login failed");v(g,e.LOGIN_FAILED);if(b){return b(g)}else{throw g;}}if(d[t]>=u[t].NOT_OK){var g=new Error("Bad authentication response status: "+d[t]);v(g,e.BAD_STATUS);
if(b){return b(g)}else{throw g;}}var h=d[B];if(!h){var g=new Error("No authentication token in response");v(g,e.NO_TOKEN);if(b){return b(g)}else{throw g;}}var i=h.match(/^Auth=(.*)/m);if(!i||!i[1]){var g=new Error("Malformed authentication token: "+h);v(g,e.MALFORMED_TOKEN);if(b){return b(g)}else{throw g;}}c.l=i[1];a.call(c)}};var da={BAD_STATUS:0,LOGIN_FAILED:1,NO_TOKEN:2,MALFORMED_TOKEN:3};w.errorType=da;w[_P].k=function(a){if(this.l){a.Authorization="GoogleLogin auth="+this.l}};var k=function(a,b,c){this.serviceName=a;this.applicationName=b;this.sessionId=Math.random();this.authenticator=c||this.j?new this.j(this):null;this.b={};this.b[z]=true;this.I={"X-If-No-Redirect":"1"}};o.Service=k;k[_P].j=F;k[_P].A=function(a){return this.b[a]};k[_P].setAltSupport=function(a,b){this.b[a]=b};k[_P].o=new S;k[_P].m=new D;k[_P].H=function(a){if(m[K]==ua){return this.m}else if(m[K]!=ma){return this.o}else{return ka(a,n[I].href)?this.o:this.m}};k[_P].i=function(a,b,c,d,e,g){this.authenticator.k(d);
var h=this.H(b),i=this.A(h.e(A))?A:(this.A(h.e(z))?z:null);if(i){var r=i==A?function(j,p,q){if(typeof j[B]=="string"){var x=j.getResponseHeader("Content-Type"),V=x.indexOf("xml")>0?Y(j[B]):pa(j[B]);return p(V,q)}else{return p(j[B],q)}}:function(j,p,q){return p(Y(j[B]),q)};this.K(h,a,b,i,c,d,r,e,g)}else{throw new Error("service does not support alt required by transport: "+h.e(A)+" or "+h.e(z));}};k[_P].K=function(a,b,c,d,e,g,h,i,r){var j=this,p=a.e(d);a.z(b,c,p,e,g,this,(function(q,x){if(q[t]<u[t].NOT_OK){return h(q,
i,x)}else if(q[t]==u[t].PRECONDITION_FAILED){if(m.isSafari){var V=q.getResponseHeader("X-Redirect-Location");return j.i(b,V,e,g,i,x)}else{return j.i(b,c,e,g,i,x)}}else if(q[t]==u[t].BAD_REQUEST&&q[B]=="Invalid Feed Type"){this.setAltSupport(A,false);return j.i(b,c,e,g,function(){j.setAltSupport(A,true);i.apply(this,arguments)},x)}else{var ca=new Error(q.statusText);ca.cause=q;if(x){return x(ca)}}}).bind(this),r)};k[_P].getFeed=function(a,b,c){return this.t(a,b,c)};k[_P].getEntry=function(a,b,c){return this.t(a,
b,c)};k[_P].t=function(a,b,c){if(this.authenticator.f()){var d=this;this.authenticator.d(function(){d.u(a,b,c)},c)}else{this.u(a,b,c)}};k[_P].u=function(a,b,c){return this.h("GET",a,"",b,c)};k[_P].insertEntry=function(a,b,c,d){if(this.authenticator.f()){var e=this;this.authenticator.d(function(){e.v(a,b,c,d)},d)}else{this.v(a,b,c,d)}};k[_P].v=function(a,b,c,d){if(!b.xmlns){b.xmlns="http://www.w3.org/2005/Atom"}var e=X(b);this.h("POST",a,e,c,d)};k[_P].updateEntry=function(a,b,c,d){if(this.authenticator.f()){var e=
this;this.authenticator.d(function(){e.B(a,b,c,d)},d)}else{this.B(a,b,c,d)}};k[_P].B=function(a,b,c,d){var e=X(b);this.h("PUT",a,e,c,d)};k[_P].deleteEntry=function(a,b,c){if(this.authenticator.f()){var d=this;this.authenticator.d(function(){d.s(a,b,c)},c)}else{this.s(a,b,c)}};k[_P].s=function(a,b,c){this.h("DELETE",a,"",b,c)};k[_P].h=function(a,b,c,d,e){var g=Z(this.I);if(c){g["Content-Length"]=c[s];g["Content-Type"]="application/atom+xml; charset=UTF-8"}else{g["Content-Length"]=0}if(a=="PUT"||a==
"DELETE"&&!m.isIe&&!m.isSafari){g["X-HTTP-Method-Override"]=a;a="POST"}else{delete g["X-HTTP-Method-Override"]}this.i(a,b,c,g,d,e)};var R=function(a,b,c){k.call(this,a,b,c);this.username=null;this.password=null;this.accountType=null;this.b[z]=true;this.b[ea]=true;this.b[ga]=true;this.b[ha]=true;this.b[A]=true;this.b[fa]=true};o.GoogleService=R;R.prototype=new k(null,null);R[_P].j=w;var C=function(a){this.feedUri=a;this.w={q:null,author:null,alt:z,"updated-min":null,"updated-max":null,"start-index":0,"max-results":0};this.g=Z(this.C)};o.Query=C;C[_P].C={q:{},author:{},alt:{defaultValue:z},"updated-min":{},"updated-max":{},"start-index":{},"max-results":{}};C[_P].setParamDef=function(a,b){this.g[a]=b};C[_P].setParam=function(a,b){if(!this.g[a]){this.setParamDef(a,{})}this.w[a]=b};C[_P].getPath=function(){var a=[];for(var b in this.g){var c=this.g[b],d=this.w[b];if(d&&d!=c.defaultValue){var e=
c.decorator?c.decorator(d):d,g=G(e);a.push(b+"="+g)}}var h=a.join("&");return h[s]?"?"+h:""};C[_P].getUri=function(){return this.feedUri+this.getPath()};var GDataUtil=l,GDataService=k,GDataGoogleService=R,GDataQuery=C,GDataAlt=o.alt;

// Main
var mt_advParent;

if (document && document.getElementById('mt_adv') != null) {
  mt_advParent = document.getElementById('mt_adv').parentNode;
  // Loads the calendar of the currently authenticated Google user
  refreshCalendarLoop('http://www.google.com/calendar/feeds/' +
      'default/private/full', 60000);
}
