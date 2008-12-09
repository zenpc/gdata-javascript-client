// Copyright 2008 Google Inc.  All Rights Reserved.

/**
 * @fileoverview This sample demonstrates how to use the read/write
 *     functionality of the Google Data JavaScript client library to interact
 *     with your Google Base items. The sample maps your geocoded items
 *     using the Google Maps API.
 * @author e.bidelman@google.com (Eric Bidelman)
 */

// =============================== GLOBALS =====================================
var baseService = null, map = null, geocoder = null;
var items = {};
var numDirty = 0;

var FEEDS = {
  scope: 'http://www.google.com/base/feeds',
  snippets: 'http://www.google.com/base/feeds/snippets',
  items: 'http://www.google.com/base/feeds/items'
};

var SAVE_BUTTON_START = 'Save changes';
var SAVE_BUTTON_WORKING = 'Saving...';
var SAVE_BUTTON_DONE = 'Saved';
var LOGIN_BUTTON_HTML =
    '<input type="button" id="login" onclick="login(FEEDS.scope);"' +
    'value="Login">';
var SAVE_BUTTON_HTML =
    '<input type="button" id="save" onclick="updateItems();" value="' +
    SAVE_BUTTON_START + '">';
// =============================================================================

/**
 * Util for laziness.
 * @param {string} id The id of the HTMLElement
 * @return {HTMLElement} id The DOM element referenced by id
 */
function $(id) {
  return document.getElementById(id);
}

/**
 * Initializes the gMap, UI, and sets up a service object for the Base API.
 */
function initialize() {
  map = setupMap();
  baseService = new google.gdata.gbase.GoogleBaseService('Goog-basejsguide-v1');
  if (getToken(FEEDS.scope)) {
    $('settings').style.display = 'block';
    $('base_items').innerHTML = 'loading...';
    getItemsFeed();
  } else {
    $('base_items').innerHTML = LOGIN_BUTTON_HTML;
  }
}

/**
 * Setup code for the gMap
 * @return {GMap2} An initialized Google Map object
 */
function setupMap() {
  if (GBrowserIsCompatible()) {
    map = new GMap2($('map_canvas'), {size: new GSize(700, 500)});
    // center on US
    map.setCenter(new GLatLng(35.17380831799959, -96.591796875), 4);
    map.addControl(new GSmallMapControl());
    map.enableScrollWheelZoom();
    geocoder = new GClientGeocoder();
  }
  return map;
}

/**
 * Authenticates a user by retrieving an AuthSubJS token.
 * @param {string} scope A valid AuthSub scope 
 */
function login(scope) {
  var token = google.accounts.user.login(scope);
}

/**
 * Revokes the user's AuthSubJS token and resets the UI.
 */
function logout() {
  if (getToken(FEEDS.scope)) {
    google.accounts.user.logout();
  }
  $('base_items').innerHTML = LOGIN_BUTTON_HTML;
  $('settings').style.display = 'none';
}

/**
 * Verifies that the user has already authenticated by checking for a token.
 * @param {string} scope A valid scope for the token
 * @return {string} The user's token, otherwise an empty string
 */
function getToken(scope) {
  return google.accounts.user.checkLogin(scope);
}

/**
 * Updates any items that the user has altered.  That includes the location
 * and/or any of the item's attributes. 
 */
function updateItems() {
  var count = 0;

  if (numDirty > 0) {
    var saveButton = $('save');
    saveButton.disabled = true;
    saveButton.value = SAVE_BUTTON_WORKING;
  } else {
    alert('No changes made');
    return;
  }

  for (var id in items) {
    if (items[id].dirty) {
      var latLng = items[id].marker.getLatLng();
      var newLoc = latLng.lat() + ', ' + latLng.lng();
      items[id].item.setAttribute('location',
                                  {type: 'location', value: newLoc});
      items[id].item.setControl({publishingPriority: {value: 'high'}});

      updateItem(id, ++count);
    }
  }
}

/**
 * Updates an individual Google Base item.  Used in updateItems().
 * @param {string} id The item's unique <id> in the form of a URL
 * @param {int} count An index in the list of items that need updating
 */
function updateItem(id, count) {
  var item = items[id].item;
  item.updateEntry(
    function() {
      if (numDirty <= count) {
        $('save').value = SAVE_BUTTON_DONE;
      }
      items[id].dirty = false; // mark as updated
    },
    handleError
  );
}

/**
 * Updates the local copy of an item by setting its attributes and
 * marking it as changed (dirty bit). 
 * @param {HTMLElement} form The form element containing the item's data
 */
function saveItem(form) {
  var id = form.item_entry_id.value;
  var title = form.item_entry_title.value;
  var itemType = form.item_entry_item_type.value;
  var content = form.item_entry_content.value;
  items[id].item.setTitle(google.gdata.Text.create(title));
  items[id].item.setAttribute(google.gdata.Text.create(content));
  items[id].item.setAttribute('item_type', {type: 'text', value: itemType});
  items[id].dirty = true;

  var saveButton = $('save');
  saveButton.disabled = false;
  saveButton.value = SAVE_BUTTON_START;

  items[id].marker.closeInfoWindow();
  numDirty++;
}

/**
 * Creates a gMap marker on the location passed in.  Stores this point
 * locally in the global items object.  
 * @param {GLatLng} point A lat/lon point the marker should be placed at
 * @param {string} id An id to reference the local copy of the Base item
 * @return {GMarker} The created gMap marker 
 */
function createMarker(point, id) {
  var myIcon = new GIcon();
  myIcon.image = 'pushpin.png';
  myIcon.shadow = 'pushpin_shadow.png';
  myIcon.iconSize = new GSize(32, 32);
  myIcon.shadowSize = new GSize(59, 32);
  myIcon.iconAnchor = new GPoint(10, 35);
  myIcon.infoWindowAnchor = new GPoint(30, 5);

  var marker = new GMarker(point, {draggable: true, icon: myIcon});
  items[id].marker = marker;
  items[id].dirty = false;

  // note that marker has been changed locations
  GEvent.addListener(marker, 'click', function() {
    showMarkerInfo(id, false);
  });

  GEvent.addListener(marker, 'dragstart', function() {
    map.closeInfoWindow();
    var saveButton = $('save');
    saveButton.disabled = false;
    if (saveButton.value != SAVE_BUTTON_START) {
      numDirty = 0;
    }
    saveButton.value = SAVE_BUTTON_START;
  });

  // note that marker has been changed locations
  GEvent.addListener(marker, 'dragend', function() {
    items[id].marker = this;
    items[id].dirty = true;
    numDirty++;
  });

  return marker;
}

/**
 * Creates a map marker by gecoding the address, if necessary, otherwise the
 * item's saved lat/lon coordinates are used.   
 * @param {string} address A non-gecoded address
 * @param {string} id An id to reference the local copy of the Base item 
 */
function createMarkerForAddress(address, id) {
  // check if we need to geocode the location (e.x. -32.81, 100.5)
  var match = address.match(/^(-?\d{1,3}[\.[\d]+]?),\s*(-?\d{1,3}[\.[\d]+]?)$/);
  if (match) {
    map.addOverlay(createMarker(new GLatLng(match[1], match[2]), id));
  } else {
    geocoder.getLatLng(address, function(point) {
      if (!point) {
        alert(address + ' not found');
      } else {
        map.addOverlay(createMarker(point, id));
      }
    });
  }
}

/**
 * Displays the local copy of an item's attributes in a marker info window.
 * The form elements are created on the fly.    
 * @param {string} id An id to reference the local copy of the Base item
 * @param {boolean} zoomIn True if the map should zoom in when displaying 
 *                         the info window
 */
function showMarkerInfo(id, zoomIn) {
  var marker = items[id].marker;
  var title = items[id].item.getTitle().getText();
  var content = items[id].item.getContent().getText();
  var itemType = items[id].item.getAttribute('item_type').getValue();
  var thumb = items[id].item.getAttribute('image_link') || '';

  if (zoomIn) {
   map.setZoom(14);
  }
  map.panTo(marker.getLatLng());

  var form = document.createElement('form');
  form.setAttribute('onsubmit', 'saveItem(this);return false;');

  if (thumb) {
    var img = document.createElement('img');
    img.setAttribute('src', thumb.getValue());
    img.setAttribute('align', 'left');
    img.setAttribute('class', 'thumb');
    form.appendChild(img);
  }

  var id_input = document.createElement('input');
  id_input.name = 'item_entry_id';
  id_input.type = 'hidden';
  id_input.value = id;
  form.appendChild(id_input);

  form.appendChild(document.createTextNode('Title:'));
  form.appendChild(document.createElement('br'));

  var title_input = document.createElement('input');
  title_input.name = 'item_entry_title';
  title_input.type = 'text';
  title_input.value = title;
  form.appendChild(title_input);
  form.appendChild(document.createElement('br'));

  form.appendChild(document.createTextNode('Item type:'));
  form.appendChild(document.createElement('br'));

  var itemtype_input = document.createElement('input');
  itemtype_input.name = 'item_entry_item_type';
  itemtype_input.type = 'text';
  itemtype_input.value = itemType;
  form.appendChild(itemtype_input);
  form.appendChild(document.createElement('br'));

  form.appendChild(document.createTextNode('Description:'));
  form.appendChild(document.createElement('br'));

  var textarea = document.createElement('textarea');
  textarea.name = 'item_entry_content';
  textarea.value = content;
  textarea.setAttribute('style', 'max-width:200px;max-height:100px;');
  form.appendChild(textarea);

  var p = document.createElement('p');

  var saveButton = document.createElement('input');
  saveButton.type = 'submit';
  saveButton.value = 'Done';
  p.appendChild(saveButton);

  var closeButton = document.createElement('input');
  closeButton.type = 'button';
  closeButton.value = 'Cancel';
  closeButton.setAttribute('onclick', 'map.closeInfoWindow();');
  p.appendChild(closeButton);

  form.appendChild(p);

  marker.openInfoWindow(form);
}

/**
 * Queries the items feed to return results that contain the location attribute.
 */
function getItemsFeed() {
  var query = new google.gdata.gbase.ItemsQuery(FEEDS.items);
  query.setBq('[location(location)]');  // Only return items with location data
  query.setMaxResults(15);
  //query.setContent('geocodes');
  baseService.getItemsFeed(query, handleFeed, handleError);
}

/**
 * Callback for getItemFeed().  This method displays the user's Google Base 
 * items that contain location data.   
 * @param {object} result An json object representing the resulting feed
 */
function handleFeed(result) {
  var entries = result.feed.entry;

  if (!entries.length) {
    $('base_items').innerHTML =
        '<span class="error">You have no items with a &lt;g:location&gt; ' +
        'attribute</span>';
    return;
  }

  var html = [];
  for (var i = 0, item; item = entries[i]; i++) {
    var title = item.getTitle().getText();
    var id = item.getId().getValue();

    items[id] = {};
    items[id].item = item;

    html.push('<li><a href="javascript:showMarkerInfo(\'' + id +
              '\', true);">' + title + '</a></li>');

    var address = item.getAttribute('location').getValue();
    createMarkerForAddress(address, id);
  }

  $('base_items').innerHTML = SAVE_BUTTON_HTML + html.join('');
  $('save').disabled = true;
}

/**
 * Error handler for getItemsFeed()
 * @param {object} e Data containing the error message
 */
function handleError(e) {
  alert('There was an error!');
  alert(e.cause ? e.cause.statusText : e.message);
}

google.load('gdata', '1.x', {packages: ['gbase']});
google.setOnLoadCallback(initialize);
