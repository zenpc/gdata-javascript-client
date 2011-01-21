/* Copyright (c) 2009 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Base url for all Sidewiki API feeds.
 */
var BASE_URL = 'https://www.google.com/sidewiki/feeds/';

/**
 * ID of the HTML element that is used to display a list of retrieved
 * entries.
 */
var entriesPaneId = '';

/**
 * ID of the HTML element that is used to display a detailed information
 * about single retrieved entry.
 */
var entryInfoPaneId = '';

/**
 * SidewikiService object from Sidewiki Javascript client library.
 */
var sidewikiService = null;

/**
 * Identifier of client application.
 */
var serviceName = '';

/**
 * Retrieves Sidewiki entries written for a specified web page and displays a
 * list of clickable entry titles.
 * @param webpage web page URI.
 */
function displayWebpageEntries(webpage) {
  var service = getSidewikiService();
  var feedUrl = BASE_URL + 'entries/webpage/' +
      encodeURIComponent(webpage) + '/full';
  service.getSidewikiEntryFeed(feedUrl, handleEntriesFeed, handleError);
}

/**
 * Retrieves Sidewiki entries written by specified author and displays a list
 * of clickable entry titles.
 * @param authorId author Google profiles ID.
 */
function displayAuthorEntries(authorId) {
  var service = getSidewikiService();
  var feedUrl = BASE_URL + 'entries/author/' + authorId + '/full';
  service.getSidewikiEntryFeed(feedUrl, handleEntriesFeed, handleError);
}

/**
 * Retrieves a single Sidewiki entry and displays its title, content
 * and other additional info.
 * @param id entry ID as specified in gd:resourceId entry element.
 */
function displaySidewikiEntry(id) {
  var service = getSidewikiService();
  service.getSidewikiEntry(id, handleEntry, handleError);
}

/**
 * Set the service name which will be provided to the Google Sidewiki
 * servers during login. This name should uniquely identify yourself,
 * your application's name, and your application's version. For example:
 * "Google-SidewikiSample-1-0" would represent Google Sidewiki Sample v1.0.
 * @param serviceName A string indicating your service's name.
 */
function setServiceName(serviceName) {
  serviceName = serviceName;
}

function setEntriesPaneId(id) {
  entriesPaneId = id;
}

function setEntryInfoPaneId(id) {
  entryInfoPaneId = id;
}

/**
 * Initializes if needed and returns SidewikiService object.
 */
function getSidewikiService() {
  if (!!sidewikiService) {
    return sidewikiService;
  }
  sidewikiService = new google.gdata.sidewiki.SidewikiService(serviceName);
  return sidewikiService;
}

/**
 * Escapes special HTML characters making untrusted text secure to be inserted
 * into elements as HTML.
 * @param text text to escape.
 * @return escaped text safe to use as HTML
 */
function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
}

/* Callback functions */

/**
 * Called when error happens during request to Google Sidewiki.
 * Displays dialog box with error message.
 * @param e error object with detailed message.
 */
function handleError(e) {
  var msg = e.cause ? e.cause.statusText : e.message;
  msg = 'ERROR: ' + msg;
  alert(msg);
}

/**
 * Callback function invoked by the Google Sidewiki library after
 * requesting Sidewiki entries. Generates HTML code that displays
 * a list of retrieved Sidewiki entries and puts it into entriesPaneId
 * document element.
 * @param feedRoot The list of groups as returned by the Sidewiki service.
 */
function handleEntriesFeed(feedRoot) {
  var entriesPane = document.getElementById(entriesPaneId);
  if (!entriesPane) {
    alert('Element with entriesPaneId could not be found. Call'
        + ' setEntriesPaneId() to define element to hold a list of retrieved'
        + ' entries.');
    return;
  }

  // Remove all entries we displayed before.
  while (entriesPane.childNodes.length > 0) {
    entriesPane.removeChild(entriesPane.childNodes[0]);
  }

  // Show feed title.
  var title = document.createElement('h3');
  title.appendChild(document.createTextNode(
      feedRoot.feed.getTitle().getText()));
  entriesPane.appendChild(title);

  // Clear entry info.
  document.getElementById(entryInfoPaneId).innerHTML = '';

  var entries = feedRoot.feed.entry;
  if (entries.length == 0) {
    var label = document.createElement('p');
    label.appendChild(document.createTextNode('No entries found.'));
    entriesPane.appendChild(label);
    return;
  }

  // Create list of entries.
  var entriesList = document.createElement('ul');
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];

    var listElement = document.createElement('li');

    // Create a hyperlink to retrieve additional info.
    var entryLink = document.createElement('a');
    entryLink.setAttribute('href',
        'javascript:displaySidewikiEntry(\'' +
            entry.getId().getValue() + '\')');
    var entryTitle = entry.getTitle().getText();
    if (entryTitle == '') {
      entryTitle = '<no title>';
    }

    // Finalize group and add to groups pane.
    entryLink.appendChild(document.createTextNode(entryTitle));
    listElement.appendChild(entryLink);
    entriesList.appendChild(listElement);
  }

  entriesPane.appendChild(entriesList);
}

/**
 * Callback function invoked by the Google Sidewiki library after
 * requesting single Sidewiki entry. Generates HTML code that displays
 * title, content, author and additional information contained in retrieved
 * entry it into entryInfoPaneId document element.
 * @param entryRoot Sidewiki entry object as returned by the Sidewiki service.
 */
function handleEntry(entryRoot) {
  var entryInfoPane = document.getElementById(entryInfoPaneId);
  if (!entryInfoPane) {
    alert('Element with entryInfoPaneId could not be found. Call'
        + ' setEntryInfoPaneId() to define element to hold detailed info'
        + ' of retrieved entry.');
    return;
  }

  // Clear existing info.
  entryInfoPane.innerHTML = '';

  var entry = entryRoot.entry;
  var entryTitle = escapeHtml(entry.getTitle().getText());
  var entryContent = escapeHtml(entry.getContent().getText());
  var author = entry.getAuthors()[0];
  var authorId = escapeHtml(author.getResourceId().getValue());
  var publishedDate =
      escapeHtml(entry.getPublished().getValue().getDate().toString());
  var authorName = escapeHtml(author.getName().getValue());
  var rating = entry.getRating();

  var entryInfoHTML = '<b>Selected entry info</b>:<br/>' +
      'Sidewiki entry "<b>' + entryTitle + '</b>" written by ' +
      '<a href=\'javascript:displayAuthorEntries("' + authorId +
      '")\';>' + authorName + '</a>:<br/>' +
      '<i>' + entryContent + '</i><br/>' +
      'Published: ' + publishedDate + '<br/>' +
      (!!rating ? ('Rating: ' + rating.getAverage() + '.'): 'Not rated.')

  var paragraph = document.createElement('p');
  paragraph.innerHTML = entryInfoHTML;
  entryInfoPane.appendChild(paragraph);
}
