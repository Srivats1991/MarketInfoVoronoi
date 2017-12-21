
var map;
var MapMarkers = [];
var MapNgbrLines = [];
var LineThickness =1;;
var LineOpacity = 0.6;
var deg2rad = Math.PI / 180;
var rad2deg = 180 / Math.PI;
var NgbrColor = "#003f00";

function SplitSegment(p0, p1) {
    var diff = 0.0;
    for (var ic = 0; ic < 3; ic++) {
        var dfc = p1[ic] - p0[ic];
        diff += dfc * dfc;
    }
    var empty = [];
    if (diff < 0.01) return empty;

    var px = new Array(3);
    for (var ic = 0; ic < 3; ic++)
        px[ic] = p0[ic] + p1[ic];
    var asqr = 0;
    for (var ic = 0; ic < 3; ic++) {
        pc = px[ic];
        asqr += pc * pc;
    }
    var normmult = 1 / Math.sqrt(asqr);
    for (var ic = 0; ic < 3; ic++)
        px[ic] *= normmult;

    return empty.concat(SplitSegment(p0, px), [px], SplitSegment(px, p1));
}

function Add_GMapLine(StoreArr, Positions, Verts, Color, Thickness, Opacity) {
    if (Verts.length < 2) return;

    var p0 = Positions[Verts[0]];
    var poss = [p0];

    for (var i = 1; i < Verts.length; i++) {
        var p = Positions[Verts[i]];
        poss = poss.concat(SplitSegment(p0, p), [p]);
        p0 = p;
    }

    var GLLs = [];
    for (var j = 0; j < poss.length; j++) {
        var p = poss[j];
        var lat = rad2deg * Math.atan2(p[2], Math.sqrt(p[0] * p[0] + p[1] * p[1]));
        var lng = rad2deg * Math.atan2(p[1], p[0]);
        GLLs.push(new google.maps.LatLng(lat, lng));
    }
    var GPln = new google.maps.Polyline({
        path: GLLs,
        strokeColor: Color,
        strokeWeight: Thickness,
        strokeOpacity: Opacity,
        clickable: false
    });
    StoreArr.push(GPln);
}

function ClearOvlyArray(OvlyArray) {
    while (OvlyArray.length > 0) {
        var ovly = OvlyArray.pop();
        ovly.setMap(null);
    }
}

function PointsChanged()
{
    ClearOvlyArray(MapNgbrLines);

    var MapPositions = [];
    for (var i = 0; i < MapMarkers.length; i++) {
        var LatLng = MapMarkers[i].getPosition();
        var lat = deg2rad * LatLng.lat();
        var lng = deg2rad * LatLng.lng();
        var lc = Math.cos(lat);
        var pt = [lc * Math.cos(lng), lc * Math.sin(lng), Math.sin(lat)];

        for (var ic = 0; ic < 3; ic++)
            pt[ic] += 1e-10 * (2 * Math.random() - 1);
        var sumsq = 0;
        for (var ic = 0; ic < 3; ic++)
            sumsq += pt[ic] * pt[ic];
        var norm = 1 / Math.sqrt(sumsq);
        for (var ic = 0; ic < 3; ic++)
            pt[ic] *= norm;
        // Accept it
        MapPositions.push(pt);
    }
    var Indices = new Array(MapPositions.length);
    for (var i = 0; i < Indices.length; i++)
        Indices[i] = i;
    
    var LagueObj = FindLaguerreIndexed(MapPositions, Indices);

    for (var i = 0; i < LagueObj.vor_edges.length; i++) {
        var edge = LagueObj.vor_edges[i];
        if (edge[0] < 0) continue;
        if (edge[1] < 0) continue;
        Add_GMapLine(MapNgbrLines, LagueObj.vor_positions, edge,
            NgbrColor, LineThickness, LineOpacity);
    }

    ShowMapObjects('Neighborhoods', MapNgbrLines);
}

function AddPoint(loc)
{

    var marker     = new google.maps.Marker({
        position: loc,
        map: map,
        draggable: true,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: 'red',
            fillOpacity: .5,
            scale: 4.5,
            strokeColor: 'white',
            strokeWeight: 1
        }
    });

    MapMarkers.push(marker);
    PointsChanged();
}


function ShowMapObjects(CheckboxID, MapObjectList)
{
    var Show = true;
    var Len = MapObjectList.length;
    for (var i = 0; i < Len; i++) {
        var MapObject = MapObjectList[i];
        MapObject.setMap(Show ? map : null);
    }
}
var mapforUSA={
    zoom: 4,
    center: new google.maps.LatLng(37.0902, -95.7129),
    mapTypeId: google.maps.MapTypeId.TERRAIN,
    streetViewControl: false
};
var mapforChina={
    zoom: 4,
    center: new google.maps.LatLng(38, 105),
    mapTypeId: google.maps.MapTypeId.TERRAIN,
    streetViewControl: false
};

function MapInit(mapfor)
{
    map = new google.maps.Map(document.getElementById('map'),mapfor);
}

function DeleteLastPoint(DoPointsChanged) {
    if (MapMarkers.length == 0) return false;
    var marker = MapMarkers.pop();
    marker.setMap(null);
    if (DoPointsChanged) PointsChanged();
    return true
}

function DeleteAllPoints() {
    while (DeleteLastPoint(false)) {}
    PointsChanged();
}


var productsDropdown = document.getElementById("productsDropdown"),
    thresholdForCheapestPrice = 40,
    thresholdForHighestReview = 4.5,
    products;

function removelist(){
    var x=document.getElementById("productsDropdown");
   while (x.length>1)
    {
        x.remove(1);
    }
}
function fillOutProductsInUSA()
{
        axios.get("productsInUSA.json").then(function(response)
    {
        var option;
        products = response.data.products;
        products.forEach(function(product)
        {
            option  = document.createElement("option");
            option.value       = product.id;
            option.textContent = product.name;
            productsDropdown.appendChild(option);
        });
    });
}
function fillOutProductsInChina()
{

    axios.get("productsInChina.json").then(function(response)
    {
        var option;
        products = response.data.products;
        products.forEach(function(product)
        {
            option  = document.createElement("option");
            option.value       = product.id;
            option.textContent = product.name;
            productsDropdown.appendChild(option);
        });
    });
}

function getSelectedProduct()
{
    var product = products.find(function(product)
    {
        return product.id === productsDropdown.value;
    });

    if(product === undefined)
    {
        alert("Please select a product");
        return false;
    }

    return product;
}

function generateVoronoiDiagram(locations)
{
    DeleteAllPoints();
    locations.forEach(AddPoint);
}

document.getElementById("mapforusa").addEventListener("click", function()
{
    removelist();
    fillOutProductsInUSA();
    MapInit(mapforUSA);
});
document.getElementById("mapforchina").addEventListener("click", function()
{
    removelist();
    fillOutProductsInChina();
    MapInit(mapforChina);
});
document.getElementById("productsForUsaBtn").addEventListener("click", function()
{
    var product = getSelectedProduct();

    if(product)
    {
        generateVoronoiDiagram(product.loc_price_review);
    }
});

document.getElementById("productsNearestBtn").addEventListener("click", function()
{
    var product = getSelectedProduct();
    var treshouldDiff=200;
    if(product)
    {

        var userLoc={
            "lat": document.getElementById("userlat").value,
            "lng": document.getElementById("userlng").value,
        };

        var locations = product.loc_price_review.filter(function(location)
        {

            var x0=document.getElementById("userlat").value;
            var y0=document.getElementById("userlng").value;
            var x=location.lat;
            var y=location.lng;
            var diff=Math.pow((x0-x),2)+Math.pow((y0-y),2);
            return diff<=treshouldDiff;
        });
        //locations.push(userLoc);
        generateVoronoiDiagram(locations);
    }
});
document.getElementById("cheapestResellerBtn").addEventListener("click", function()
{
    var product = getSelectedProduct();

    if(product)
    {
        var locations = product.loc_price_review.filter(function(location)
        {
            return location.price <= thresholdForCheapestPrice;
        });

        generateVoronoiDiagram(locations);
    }
});

document.getElementById("highestReviewBtn").addEventListener("click", function()
{
    var product = getSelectedProduct();

    if(product)
    {
        var locations = product.loc_price_review.filter(function(location)
        {
            return location.review >= thresholdForHighestReview;
        });

        generateVoronoiDiagram(locations);
    }
});

window.onload = function()
{
    fillOutProductsInUSA();
    MapInit(mapforUSA);

}