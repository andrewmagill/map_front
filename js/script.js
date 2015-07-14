var app = angular.module('myApp', []);

Array.prototype.peek = function () {
    if (this.length>0) return this[0];
  };

app.constant('LOCATOR_SERVICE_URL', "http://www.austintexas.gov/gis/rest/Geocode/COA_Address_Locator/GeocodeServer/findAddressCandidates")
   .constant('MAP_SERVICE_URL', "http://www.austintexas.gov/GIS/REST/ZoningProfile/ZoningProfile/MapServer/identify");

app.factory('locatorService', 
            ['$http', 'LOCATOR_SERVICE_URL',
             function($http, LOCATOR_SERVICE_URL) {      
              return {
                getAddressCandidates: function(addressInput) {
                  return $http.jsonp(
                    LOCATOR_SERVICE_URL, { 
                      params: {
                        street : addressInput,
                        outField : 'StreetName',
                        maxLocations : '5',
                        f : 'json',
                        callback : 'JSON_CALLBACK'
                      }}
                  )}}
             }])
   .factory('mapService', 
            ['$http', 'MAP_SERVICE_URL',
             function($http, MAP_SERVICE_URL) {
              return {
                select: function(queryParameters) {
                  return $http.jsonp(MAP_SERVICE_URL, queryParameters);
                },
                constructQueryParams: 
                  function(geometry, spatialReference, geometryType, returnGeometry, strLayerIds) {    
                    return { 
                      params: {
                        geometry: geometry,
                        tolerance: '1',
                        returnGeometry: returnGeometry,
                        mapExtent: {
                          xmin: geometry.x-100,
                          ymin: geometry.y-100,
                          xmax: geometry.x+100,
                          ymax: geometry.y+100,
                          spatialReference: {
                            wkid: spatialReference
                          }
                        },
                        imageDisplay: '400,400,96',
                        geometryType: geometryType,
                        sr: '2277',
                        layers: 'all:' + strLayerIds,
                        f: 'json',
                        callback : 'JSON_CALLBACK'
                      }
                    };
                  }}
             }]);                  

app.controller('MainCtrl', function($scope, $http, locatorService, mapService) {
   
  var getAddresses = function(strInput) {
    return locatorService.getAddressCandidates(strInput)    
      .then(function(json) {      
        $scope.candidates = json.data;                  
        return candidate = json.data.candidates.peek();
      });
    },
    getParcels = function(candidate) {          
      var queryParams = mapService.constructQueryParams(
                          candidate.location,                           
                          candidate.latestWkid,
                          'esriGeometryPoint',
                          true,
                          "3");
      return mapService.select(queryParams)
        .then(function(json) {
          $scope.parcels = json.data;            
          return parcel = json.data.results.peek();
        });
    },
    getOverlays = function(parcel) {
      var queryParams = mapService.constructQueryParams(
                          parcel.geometry,                           
                          parcel.latestWkid,
                          parcel.geometryType,
                          false,
                          "");
      return mapService.select(queryParams)
        .then(function(json) {        
          $scope.overlays = json.data;
        });
    };
  
  $scope.search = function(strInput) { 
    getAddresses(strInput)
      .then(getParcels)
      .then(getOverlays);
  };
  
  $scope.input = null;
  $scope.candidates = null;
  $scope.parcels = null;
  $scope.overlays = null;
});