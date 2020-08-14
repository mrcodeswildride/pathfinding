let mapBox = document.getElementById(`mapBox`)
let canvas = document.getElementById(`canvas`)
let context = canvas.getContext(`2d`)

let cityInput = document.getElementById(`cityInput`)
let sacramentoButton = document.getElementById(`sacramentoButton`)
let bayAreaButton = document.getElementById(`bayAreaButton`)

let city1Input = document.getElementById(`city1Input`)
let city2Input = document.getElementById(`city2Input`)
let pathButton = document.getElementById(`pathButton`)

let showAllCheckbox = document.getElementById(`showAllCheckbox`)
let pathsBox = document.getElementById(`pathsBox`)

let nodes = {}
let selectedCity
let shortestPath
let canvasImageData

mapBox.addEventListener(`click`, addCity)
sacramentoButton.addEventListener(`click`, showSacramento)
bayAreaButton.addEventListener(`click`, showBayArea)

pathButton.addEventListener(`click`, findShortestPath)
showAllCheckbox.addEventListener(`change`, toggleShowAll)

city1Input.addEventListener(`keydown`, keyPressed)
city2Input.addEventListener(`keydown`, keyPressed)
cityInput.focus()

function addCity(event) {
  let city = cityInput.value.trim()

  if (city != `` && nodes[city] == null) {
    eraseShortestPath()
    addNode(city, event.offsetX, event.offsetY)
    cityInput.value = ``
  }

  cityInput.focus()
}

function selectCity(event) {
  event.stopPropagation()

  if (selectedCity == null) {
    eraseShortestPath()

    selectedCity = this
    selectedCity.classList.add(`selected`)
  }
  else if (selectedCity == this) {
    selectedCity.classList.remove(`selected`)
    selectedCity = null
  }
  else {
    let selectedCityName = selectedCity.nextSibling.innerHTML
    let thisCityName = this.nextSibling.innerHTML

    if (lineExists(selectedCityName, thisCityName)) {
      selectedCity.classList.remove(`selected`)
      selectedCity = this
      selectedCity.classList.add(`selected`)
    }
    else {
      connectNodes(selectedCityName, thisCityName)

      selectedCity.classList.remove(`selected`)
      selectedCity = null
    }
  }
}

function addNode(nodeName, x, y) {
  makeCityDiv(nodeName, x, y)

  nodes[nodeName] = []
}

function connectNodes(nodeName1, nodeName2) {
  let city1Div = getCityDiv(nodeName1)
  let city2Div = getCityDiv(nodeName2)

  drawLine(city1Div, city2Div)

  let a = city2Div.offsetLeft - city1Div.offsetLeft
  let b = city2Div.offsetTop - city1Div.offsetTop
  let lineLength = Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2))

  nodes[nodeName1].push({
    to: nodeName2,
    length: lineLength
  })

  nodes[nodeName2].push({
    to: nodeName1,
    length: lineLength
  })
}

function lineExists(nodeName1, nodeName2) {
  for (let line of nodes[nodeName1]) {
    if (line.to == nodeName2) {
      return true
    }
  }

  return false
}

function findShortestPath() {
  let city1 = city1Input.value.trim()
  let city2 = city2Input.value.trim()

  if (city1 != `` && city2 != ``) {
    eraseShortestPath()

    if (nodes[city1] == null) {
      pathsBox.innerHTML = `Starting city does not exist.`
    }
    else if (nodes[city2] == null) {
      pathsBox.innerHTML = `Destination city does not exist.`
    }
    else {
      let paths = []
      findPaths(city1, city2, [city1], 0, paths)

      if (paths.length == 0) {
        pathsBox.innerHTML = `No path found.`
      }
      else {
        shortestPath = getShortestPath(paths)

        for (let path of paths) {
          makePathDiv(path)
        }

        drawShortestPath()
      }
    }
  }
}

function findPaths(city1, city2, path, distanceTraveled, paths) {
  if (city1 == city2) {
    paths.push({
      cities: path,
      distance: distanceTraveled
    })
  }
  else {
    for (let line of nodes[city1]) {
      let neighbor = line.to

      if (!path.includes(neighbor)) {
        let pathCopy = path.slice()
        pathCopy.push(neighbor)

        findPaths(neighbor, city2, pathCopy, distanceTraveled + line.length, paths)
      }
    }
  }
}

function getShortestPath(paths) {
  let shortest = paths[0]

  for (let path of paths) {
    if (path.distance < shortest.distance) {
      shortest = path
    }
  }

  return shortest
}

function toggleShowAll() {
  let pathDivs = pathsBox.querySelectorAll(`.path`)

  for (let pathDiv of pathDivs) {
    if (showAllCheckbox.checked) {
      pathDiv.classList.remove(`hidden`)
    }
    else if (!pathDiv.classList.contains(`shortest`)) {
      pathDiv.classList.add(`hidden`)
    }
  }
}

function makeCityDiv(city, x, y) {
  let cityDiv = document.createElement(`div`)
  cityDiv.classList.add(`city`)
  cityDiv.addEventListener(`click`, selectCity)

  let cityNameDiv = document.createElement(`div`)
  cityNameDiv.classList.add(`cityName`)
  cityNameDiv.innerHTML = city

  mapBox.appendChild(cityDiv)
  mapBox.appendChild(cityNameDiv)

  cityDiv.style.left = `${x - cityDiv.offsetWidth / 2}px`
  cityDiv.style.top = `${y - cityDiv.offsetHeight / 2}px`

  cityNameDiv.style.left = `${x - cityNameDiv.offsetWidth / 2}px`
  cityNameDiv.style.top = `${y + 12}px`
}

function getCityDiv(city) {
  let cityDivs = mapBox.querySelectorAll(`.city`)

  for (let cityDiv of cityDivs) {
    let cityNameDiv = cityDiv.nextSibling

    if (cityNameDiv.innerHTML == city) {
      return cityDiv
    }
  }

  return null
}

function makePathDiv(path) {
  let pathDiv = document.createElement(`div`)
  pathDiv.classList.add(`path`)

  if (path == shortestPath) {
    pathDiv.classList.add(`shortest`)
  }
  else if (!showAllCheckbox.checked) {
    pathDiv.classList.add(`hidden`)
  }

  let pathString = path.cities.join(` - `)
  let pathDistance = path.distance.toFixed(0)
  pathDiv.innerHTML = `${pathString} (${pathDistance})`

  pathsBox.appendChild(pathDiv)
}

function drawShortestPath() {
  canvasImageData = context.getImageData(0, 0, canvas.width, canvas.height)

  for (let i = 0; i < shortestPath.cities.length; i++) {
    let cityDiv = getCityDiv(shortestPath.cities[i])
    cityDiv.classList.add(`highlighted`)

    if (i < shortestPath.cities.length - 1) {
      let city2Div = getCityDiv(shortestPath.cities[i + 1])
      drawLine(cityDiv, city2Div, `#00a2e8`, 5)
    }
  }
}

function eraseShortestPath() {
  pathsBox.innerHTML = ``

  if (selectedCity != null) {
    selectedCity.classList.remove(`selected`)
    selectedCity = null
  }

  if (shortestPath != null) {
    for (let city of shortestPath.cities) {
      let cityDiv = getCityDiv(city)
      cityDiv.classList.remove(`highlighted`)
    }

    context.putImageData(canvasImageData, 0, 0)

    shortestPath = null
    canvasImageData = null
  }
}

function drawLine(city1Div, city2Div, color, width) {
  let city1X = city1Div.offsetLeft + city1Div.offsetWidth / 2
  let city1Y = city1Div.offsetTop + city1Div.offsetHeight / 2
  let city2X = city2Div.offsetLeft + city2Div.offsetWidth / 2
  let city2Y = city2Div.offsetTop + city2Div.offsetHeight / 2

  context.beginPath()
  context.moveTo(city1X, city1Y)
  context.lineTo(city2X, city2Y)
  context.strokeStyle = color ? color : `black`
  context.lineWidth = width ? width : `1`
  context.stroke()
  context.closePath()
}

function clearMap() {
  pathsBox.innerHTML = ``

  let mapDivs = mapBox.querySelectorAll(`div`)

  for (let mapDiv of mapDivs) {
    mapDiv.remove()
  }

  context.clearRect(0, 0, canvas.width, canvas.height)

  nodes = {}
  selectedCity = null
  shortestPath = null
  canvasImageData = null
}

function keyPressed(event) {
  if (event.keyCode == 13) {
    findShortestPath()
  }
}

function showSacramento() {
  clearMap()

  addNode(`Folsom`, 450, 227)
  addNode(`Fair Oaks`, 340, 259)
  addNode(`Rancho Cordova`, 216, 340)
  addNode(`Sacramento`, 60, 340)
  addNode(`North Highlands`, 147, 184)
  addNode(`Citrus Heights`, 271, 135)
  addNode(`Roseville`, 327, 80)
  addNode(`Rocklin`, 403, 35)

  connectNodes(`Folsom`, `Fair Oaks`)
  connectNodes(`Fair Oaks`, `Rancho Cordova`)
  connectNodes(`Rancho Cordova`, `Sacramento`)
  connectNodes(`Sacramento`, `North Highlands`)
  connectNodes(`North Highlands`, `Citrus Heights`)
  connectNodes(`Citrus Heights`, `Roseville`)
  connectNodes(`Roseville`, `Rocklin`)
  connectNodes(`Rocklin`, `Folsom`)
  connectNodes(`Fair Oaks`, `Roseville`)
  connectNodes(`Fair Oaks`, `Citrus Heights`)
  connectNodes(`Rancho Cordova`, `Citrus Heights`)
  connectNodes(`Rancho Cordova`, `North Highlands`)

  city1Input.value = ``
  city2Input.value = ``
  city1Input.focus()
}

function showBayArea() {
  clearMap()

  addNode(`San Jose`, 450, 340)
  addNode(`Mountain View`, 302, 319)
  addNode(`Palo Alto`, 210, 279)
  addNode(`San Mateo`, 104, 199)
  addNode(`San Francisco`, 60, 77)
  addNode(`Oakland`, 143, 35)
  addNode(`Hayward`, 255, 108)
  addNode(`Fremont`, 364, 200)

  connectNodes(`San Jose`, `Mountain View`)
  connectNodes(`Mountain View`, `Palo Alto`)
  connectNodes(`Palo Alto`, `San Mateo`)
  connectNodes(`San Mateo`, `San Francisco`)
  connectNodes(`San Francisco`, `Oakland`)
  connectNodes(`Oakland`, `Hayward`)
  connectNodes(`Hayward`, `Fremont`)
  connectNodes(`Fremont`, `San Jose`)
  connectNodes(`Palo Alto`, `Fremont`)
  connectNodes(`San Mateo`, `Hayward`)

  city1Input.value = ``
  city2Input.value = ``
  city1Input.focus()
}