var map = null;
var markers = null;

// ----------------------------------------------------------------------------
// Name:        init
// Parameters:  None
// 
// Initializes the UI for this demo. Creates a new Leaflet map. Creates tile 
// layers using the MapBox.js plugin for Leaflet. Creates new LayerGroup for 
// markers. Initializes functionality of search components using jQuery. 
// Initializes base map toggle controls using jQuery UI. Loads initial symbols.
// ----------------------------------------------------------------------------

var init = function () {

    // ---- Map Initialization ----

    map = new L.map("map", {
        center: [38.895111, -77.036667],
        minZoom: 11,
        maxZoom: 16,
        zoom: 12
    });

    // ---- Map Data Layers and Groups ----

    var strTiles = new L.mapbox.tileLayer("geovista.open-streets-dc");
    markers = new L.LayerGroup().addTo(map);

    // ---- jQuery for UI Elements ----

    // Set text input to query the SymbolStore API when user presses 'enter'

    $("#searchfield").on('keypress', function (e) {
        if (e.keyCode == 13)  { 
            getSymbols($("#searchfield").val());
            return false;
        }
    });

    // Set button to query SymbolStore API on click

    $("#searchbutton").on('click', function () {
        getSymbols($("#searchfield").val());
    });

    getSymbols();
};

// ----------------------------------------------------------------------------
// Name:        getSymbols
// Parameters:  
//      searchTerm - Query term fed to SymbolStore API to refine results
// 
// Queries the SymbolStore API to retrieve the symbols requested by the user. 
// 
// The searchTerm parameter allows the user to refine their search to only 
// return the symbols related to a particular topic; i.e. using the search term
// 'fire' will return all symbols in the SymbolStore related to 'fire', 
// including fire stations, forest fire, etc. The response received from the 
// SymbolStore is then passed to the `processSymbols` function.
// ----------------------------------------------------------------------------

var getSymbols = function (searchTerm) {
    $.ajax({
        'url' : "http://www.symbolstore.org/SymbolStoreRelease3REST/SymbolService.asmx/SearchSymbols",
        'data' : {
            'searchTerms' : ((searchTerm && searchTerm.length > 0) ? searchTerm : ""),
            'searchField' : "",
            'sortType'    : "",
            'page'        : 1,
            'format'      : ""
        }
    })
    .done(processSymbols);
};

// ----------------------------------------------------------------------------
// Name:        processSymbols
// Parameters:  
//      symbolData - JSON data returned from querying the SymbolStore API
// 
// Parses response from the SymbolStore, adding first 5 symbols to the map. 
// 
// When the application queries the SymbolStore API is receives the following 
// response, formatted as JSON. 
// 
// {
//     'searchterms': [String] Term(s) used to query the SymbolStore database
//     'hitscount'  : [Number] # of symbols associated with search term,
//     'numpages'   : [Number] # of pages of symbols (25 symbols per page)
//     'page'       : [Number] Index of the first page in the list of pages
//     'searchfield': [String] Field(s) search term was used to query in database
//     'message'    : [String] 'Success' or error message details
//     'currentpage': [Number] Page viewed in this response
//     'symbols'    : [
//         {
//             'id'                     : [Number] Unique ID of symbol in database
//             'name'                   : [String] Name of symbol
//             'url'                    : [String] URL to PNG image of symbol
//             'keywords'               : [String] Comma separted list of keywords descibing this symbol
//             'description'            : [String] Description of the symbol
//             'tags'                   : [String] Comma separted list of tags categorizing this symbol
//             'rating'                 : [Number] Rating of this symbol (not used)
//             'uploadtime'             : [String] UNIX Epoch Time of upload into database
//             'contributoremail'       : [String] Email address of website of contributor
//             'contributorname'        : [String] Name of contributor
//             'contributororganization': [String] Name of contributing organization
//         },
//         ...
//     ]
// }
//
// This function parses this response, turns the first 5 symbols listed in the 
// `symbols` array (or fewer if there less than 5 symbols are returned) into 
// Leaflet Markers, and adds these markers to the map. Markers also have 
// pop-ups, activated on click, that give details on the metadata associated 
// with that symbol.
// ----------------------------------------------------------------------------

var processSymbols = function (symbolData) {

    // Clear any existing symbols from the map

    if (markers) {
        markers.clearLayers();
    }

    // Check that the query returned data, if not log it and return

    if (!symbolData) { 
        console.log("No data returned from request"); 
        return;
    }

    if (symbolData.hitscount < 1) {
        console.log("No symbols returned for request");
        return;
    }

    // Some static locations to place symbols at on the map

    var positions = [
        [38.8945036, -77.0355398],
        [38.8991629, -77.0425136],
        [38.9088221, -77.0272914],
        [38.9135349, -77.0393075],
        [38.9169409, -77.0547570]
    ];

    // Calculating the number of symbols to add to the map

    var numSymbols = (symbolData.hitscount < positions.length ? 
        symbolData.hitscount : positions.length);

    // Looping through the symbols returned in the response

    for (var i = 0; i < numSymbols; i++) {
        var symbol = symbolData.symbols[i];

        // Creating a new Leaflet Marker to add to the LayerGroup
        // Includes creating a custom Leaflet Icon for the marker using the symbol's URL

        var marker = new L.Marker(
            positions[i],
            {
                icon: new L.Icon({
                    iconUrl: symbol.url,
                    iconSize: [20,20]
                }),
                title: symbol.name
            }
        );

        // Creating a pop-up with the metadata for this symbol

        var popup = new L.Popup();
        popup.setContent(
            "<b>" + symbol.name + "</b><br/>" +
            "Description &ndash; " + symbol.description + "<br/>" +
            "Contributed by: " + symbol.contributorname + 
            ((symbol.contributororganization && symbol.contributororganization.length >0) ? 
                "(" + symbol.contributororganization + ")" : "")
        );

        // Binding the pop-up to the marker and adding the marker to the marker group

        marker.bindPopup(popup);
        markers.addLayer(marker);
    }
}
