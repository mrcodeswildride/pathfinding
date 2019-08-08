var box = document.getElementById("box");
var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");

var cityInput = document.getElementById("city");
var sacramentoButton = document.getElementById("sacramento");
var bayAreaButton = document.getElementById("bayArea");

var city1Input = document.getElementById("city1");
var city2Input = document.getElementById("city2");
var findShortestPathButton = document.getElementById("findShortestPath");
var showAllCheckbox = document.getElementById("showAll");

var pathsDiv = document.getElementById("paths");

var nodes = {};
var selectedCity = null;
var shortestPath = null;
var preDrawnPathCanvas = null;

box.addEventListener("click", addCity);
sacramentoButton.addEventListener("click", showSacramento);
bayAreaButton.addEventListener("click", showBayArea);

city1Input.addEventListener("keydown", cityInputKeydown);
city2Input.addEventListener("keydown", cityInputKeydown);
findShortestPathButton.addEventListener("click", findShortestPath);
showAllCheckbox.addEventListener("change", toggleHiddenPaths);

cityInput.focus();

function addCity(event) {
    var city = cityInput.value.trim();

    if (city != "" && !nodes[city]) {
        eraseShortestPath();
        addNode(city, event.offsetX, event.offsetY);
        cityInput.value = "";
    }

    cityInput.focus();
}

function selectCity(event) {
    event.stopPropagation();

    if (!selectedCity) {
        eraseShortestPath();

        this.classList.add("selected");
        selectedCity = this;
    }
    else if (this == selectedCity) {
        selectedCity.classList.remove("selected");
        selectedCity = null;
    }
    else {
        var selectedCityName = selectedCity.nextSibling.innerHTML;
        var thisCityName = this.nextSibling.innerHTML;

        if (lineExists(selectedCityName, thisCityName)) {
            selectedCity.classList.remove("selected");
            this.classList.add("selected");
            selectedCity = this;
        }
        else {
            connectNodes(selectedCityName, thisCityName);

            selectedCity.classList.remove("selected");
            selectedCity = null;
        }
    }
}

function showSacramento() {
    clearMap();

    addNode("Folsom", 450, 227);
    addNode("Fair Oaks", 340, 259);
    addNode("Rancho Cordova", 216, 340);
    addNode("Sacramento", 60, 340);
    addNode("North Highlands", 147, 184);
    addNode("Citrus Heights", 271, 135);
    addNode("Roseville", 327, 80);
    addNode("Rocklin", 403, 35);

    connectNodes("Folsom", "Fair Oaks");
    connectNodes("Fair Oaks", "Rancho Cordova");
    connectNodes("Rancho Cordova", "Sacramento");
    connectNodes("Sacramento", "North Highlands");
    connectNodes("North Highlands", "Citrus Heights");
    connectNodes("Citrus Heights", "Roseville");
    connectNodes("Roseville", "Rocklin");
    connectNodes("Rocklin", "Folsom");
    connectNodes("Fair Oaks", "Roseville");
    connectNodes("Fair Oaks", "Citrus Heights");
    connectNodes("Rancho Cordova", "Citrus Heights");
    connectNodes("Rancho Cordova", "North Highlands");

    city1Input.value = "";
    city2Input.value = "";
    city1Input.focus();
}

function showBayArea() {
    clearMap();

    addNode("San Jose", 450, 340);
    addNode("Mountain View", 302, 319);
    addNode("Palo Alto", 210, 279);
    addNode("San Mateo", 104, 199);
    addNode("San Francisco", 60, 77);
    addNode("Oakland", 143, 35);
    addNode("Hayward", 255, 108);
    addNode("Fremont", 364, 200);

    connectNodes("San Jose", "Mountain View");
    connectNodes("Mountain View", "Palo Alto");
    connectNodes("Palo Alto", "San Mateo");
    connectNodes("San Mateo", "San Francisco");
    connectNodes("San Francisco", "Oakland");
    connectNodes("Oakland", "Hayward");
    connectNodes("Hayward", "Fremont");
    connectNodes("Fremont", "San Jose");
    connectNodes("Palo Alto", "Fremont");
    connectNodes("San Mateo", "Hayward");

    city1Input.value = "";
    city2Input.value = "";
    city1Input.focus();
}

function addNode(nodeName, x, y) {
    var cityDiv = document.createElement("div");
    cityDiv.classList.add("city");
    cityDiv.addEventListener("click", selectCity);

    var cityNameDiv = document.createElement("div");
    cityNameDiv.classList.add("cityName");
    cityNameDiv.innerHTML = nodeName;

    box.appendChild(cityDiv);
    box.appendChild(cityNameDiv);

    cityDiv.style.left = (x - cityDiv.offsetWidth / 2) + "px";
    cityDiv.style.top = (y - cityDiv.offsetHeight / 2) + "px";

    cityNameDiv.style.left = (x - cityNameDiv.offsetWidth / 2) + "px";
    cityNameDiv.style.top = (y + 12) + "px";

    nodes[nodeName] = [];
}

function connectNodes(nodeName1, nodeName2) {
    var node1 = getCityDiv(nodeName1);
    var node2 = getCityDiv(nodeName2);

    drawLine(node1, node2);

    var a = node2.offsetLeft - node1.offsetLeft;
    var b = node2.offsetTop - node1.offsetTop;
    var lineLength = Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));

    nodes[nodeName1].push({
        to: nodeName2,
        length: lineLength
    });

    nodes[nodeName2].push({
        to: nodeName1,
        length: lineLength
    });
}

function clearMap() {
    while (box.querySelectorAll("div").length > 0) {
        box.removeChild(box.querySelectorAll("div")[0]);
    }

    context.clearRect(0, 0, canvas.width, canvas.height);

    pathsDiv.innerHTML = "";

    nodes = {};
    selectedCity = null;
    shortestPath = null;
    preDrawnPathCanvas = null;
}

function cityInputKeydown(event) {
    if (event.keyCode == 13) {
        findShortestPath();
    }
}

function findShortestPath() {
    var city1 = city1Input.value.trim();
    var city2 = city2Input.value.trim();

    if (city1 != "" && city2 != "") {
        eraseShortestPath();

        if (!nodes[city1]) {
            var invalidStartingCityMessage = document.createElement("p");
            invalidStartingCityMessage.innerHTML = "Starting city does not exist.";
            pathsDiv.appendChild(invalidStartingCityMessage);
        }
        else if (!nodes[city2]) {
            var invalidDestinationCityMessage = document.createElement("p");
            invalidDestinationCityMessage.innerHTML = "Destination city does not exist.";
            pathsDiv.appendChild(invalidDestinationCityMessage);
        }
        else {
            var paths = [];
            findPaths(city1, city2, [city1], 0, paths);

            shortestPath = {
                cities: [],
                distance: Infinity
            };

            for (var i = 0; i < paths.length; i++) {
                if (paths[i].distance < shortestPath.distance) {
                    shortestPath = paths[i];
                }
            }

            if (paths.length == 0) {
                var noPathMessage = document.createElement("p");
                noPathMessage.innerHTML = "No path found.";
                pathsDiv.appendChild(noPathMessage);
            }
            else {
                for (var i = 0; i < paths.length; i++) {
                    var pathDiv = document.createElement("div");
                    pathDiv.classList.add("path");

                    if (paths[i] == shortestPath) {
                        pathDiv.classList.add("shortest");
                    }
                    else if (!showAllCheckbox.checked) {
                        pathDiv.classList.add("hidden");
                    }

                    for (var j = 0; j < paths[i].cities.length; j++) {
                        pathDiv.innerHTML += paths[i].cities[j];

                        if (j < paths[i].cities.length - 1) {
                            pathDiv.innerHTML += " - ";
                        }
                    }

                    pathDiv.innerHTML += " (" + paths[i].distance.toFixed(0) + ")";
                    pathsDiv.appendChild(pathDiv);
                }
            }

            drawShortestPath();
        }
    }
}

function toggleHiddenPaths() {
    var pathDivs = document.querySelectorAll(".path");

    for (var i = 0; i < pathDivs.length; i++) {
        if (showAllCheckbox.checked) {
            pathDivs[i].classList.remove("hidden");
        }
        else if (!pathDivs[i].classList.contains("shortest")) {
            pathDivs[i].classList.add("hidden");
        }
    }
}

function findPaths(city1, city2, path, distanceTraveled, paths) {
    if (city1 == city2) {
        paths.push({
            cities: path,
            distance: distanceTraveled
        });
    }
    else {
        var city1Node = nodes[city1];

        for (var i = 0; i < city1Node.length; i++) {
            var line = city1Node[i];
            var neighbor = line.to;

            if (!path.includes(neighbor)) {
                var pathCopy = path.slice();
                pathCopy.push(neighbor);

                findPaths(neighbor, city2, pathCopy, distanceTraveled + line.length, paths);
            }
        }
    }
}

function lineExists(city1, city2) {
    var city1Node = nodes[city1];

    for (var i = 0; i < city1Node.length; i++) {
        var line = city1Node[i];

        if (line.to == city2) {
            return true;
        }
    }

    return false;
}

function drawLine(city1Div, city2Div, color, width) {
    var city1X = city1Div.offsetLeft + city1Div.offsetWidth / 2;
    var city1Y = city1Div.offsetTop + city1Div.offsetHeight / 2;
    var city2X = city2Div.offsetLeft + city2Div.offsetWidth / 2;
    var city2Y = city2Div.offsetTop + city2Div.offsetHeight / 2;

    context.beginPath();
    context.moveTo(city1X, city1Y);
    context.lineTo(city2X, city2Y);
    context.strokeStyle = color ? color : "black";
    context.lineWidth = width ? width : "1";
    context.stroke();
    context.closePath();
}

function drawShortestPath() {
    preDrawnPathCanvas = context.getImageData(0, 0, canvas.width, canvas.height);

    for (var i = 0; i < shortestPath.cities.length; i++) {
        var cityDiv = getCityDiv(shortestPath.cities[i]);
        cityDiv.classList.add("highlighted");

        if (i < shortestPath.cities.length - 1) {
            var city2Div = getCityDiv(shortestPath.cities[i + 1]);
            drawLine(cityDiv, city2Div, "#00a2e8", "5");
        }
    }
}

function eraseShortestPath() {
    pathsDiv.innerHTML = "";

    if (selectedCity) {
        selectedCity.classList.remove("selected");
        selectedCity = null;
    }

    if (shortestPath) {
        for (var i = 0; i < shortestPath.cities.length; i++) {
            var cityDiv = getCityDiv(shortestPath.cities[i]);
            cityDiv.classList.remove("highlighted");
        }

        context.putImageData(preDrawnPathCanvas, 0, 0);

        shortestPath = null;
        preDrawnPathCanvas = null;
    }
}

function getCityDiv(city) {
    var cityDivs = document.querySelectorAll(".city");

    for (var i = 0; i < cityDivs.length; i++) {
        var cityNameDiv = cityDivs[i].nextSibling;

        if (cityNameDiv.innerHTML == city) {
            return cityDivs[i];
        }
    }

    return null;
}
