/* FacebookBirthdayManager
 * Copyright (c) 2007 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * This script relies on facebook URL scheme.
 * If it breaks, it can likely be fixed by changing what's passed into the various xpath commands.
 * This works in conjunction with the Birthday Manager, a sample for the Javascript API.
 */


// ==UserScript==

// @name          Facebook Birthday Manager

// @namespace     http://www.google.com

// @description   Adds a link on profile pages that will let you add a user's birthday to your calendar.

// @include       *.thefacebook.com/profile.php*

// @include       *.facebook.com/profile.php*

// ==/UserScript==



// Facebook shows month names. This maps them to 1-12.
var monthNumMappings = {
  'January': 1,
  'February': 2,
  'March': 3,
  'April': 4,
  'May': 5,
  'June': 6,
  'July': 7,
  'August': 8, 
  'September': 9,
  'October': 10,
  'November': 11,
  'December': 12
};

/**
 * This utility function uses a Firefox-specific function
 *  to perform an XPath search on the document nodes.
 * @param {String} Xpath query 
 * @return {XPathResult} Nodes found from query.
 */
function xPath(query) {
  return document.evaluate(query, document, null, 
      XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
}

/**
 * This function looks for the birthday, name, and picture on the page.
 * It returns if it cannot find any of the required areas.
 * If successful, it calls the function to create the button link.
 */
function insertAddLink() {
  var monthDayLinks = xPath('//a[contains(@href, 's.php?adv&k=10010')]');
  if (monthDayLinks.snapshotLength > 0) { //take the first
    var monthDayLink = monthDayLinks.snapshotItem(0);
    var monthDayText = monthDayLink.innerHTML;
    var monthText = monthDayText.split(' ')[0];
    var dayText = monthDayText.split(' ')[1];
  } else {
    return;
  }

  var yearLinks = xPath('//a[contains(@href, 'b.php?k=10010&n=-1&y1=')]');
  if (yearLinks.snapshotLength > 0) { //take the first
    var yearLink = yearLinks.snapshotItem(0);
    var yearText = yearLink.innerHTML;
  } else {
    return;
  }


  var picImgs = xPath('//a[contains(@href, 'album.php?profile')]/img')
  if (picImgs.snapshotLength > 0) { //take the first
    var picImg = picImgs.snapshotItem(0);
  } else {
    var picImg = '';
  }
   
  var nameHs = xPath('//div[@class='profile_name']/h2');
  if (nameHs.snapshotLength > 0) { //take the first
    var nameH = nameHs.snapshotItem(0);
    var nameText = nameH.lastChild.nodeValue;
  } else {
    var nameText = 'Unknown name';
  } 

  var profileUrl = window.location.href;

  // Create button link
  var addLink = makeAgeNode(nameText, dayText, monthText, 
      yearText, picImg.src, profileUrl);

  // Append new button link after year div
  if (yearLink.nextSibling == null) {
      yearLink.parentNode.appendChild(addLink);
    } else {
      yearLink.parentNode.insertBefore(addLink, node.nextSibling);
    }
}


/**
 * This function inserts an image that links to the Birthday Manager,
 *  with the user data in the query string.
 * @param {String} nameText
 * @param {String} dayText
 * @param {String} monthText
 * @param {String} yearText
 * @param {String} picImgSrc
 * @param {String} profileUrl
 * @return {Node} Span containing image link
 */
function makeAgeNode(nameText, dayText, monthText, yearText, picImgSrc, profileUrl) {
  var container = document.createElement('span');

  var addToCalImage = document.createElement('img');
  addToCalImage.setAttribute('src', 
    'http://gdata-javascript-client.googlecode.com/svn/trunk/samples/calendar/birthday_manager/birthday_manager/images/birthdayreminder_addtocal.png');

  var link = document.createElement('a');
  var baseUrl = 'http://gdata-javascript-client.googlecode.com/' +
      'svn/trunk/samples/calendar/birthday_manager/' +
      'birthday_manager.html';
  var url = baseUrl + '?name=' + escape(nameText) + '&birthdate=' + 
      monthNumMappings[monthText] + '/' + dayText + '/' + yearText + 
      '&image=' + picImgSrc + '&profile=' + profileUrl;

  link.setAttribute('href', url);
  link.appendChild(addToCalImage);
  container.appendChild(document.createTextNode(' '));
  container.appendChild(link);
  
  return (container);
}


insertAddLink();
