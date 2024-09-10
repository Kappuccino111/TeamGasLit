document.addEventListener('DOMContentLoaded', function () {
    console.log("map.js is loaded");

    var map = L.map('map').setView([51.1657, 10.4515], 6);  // Initial map view for Germany

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    var marker;
    var powerStationLayer = L.layerGroup().addTo(map);  // Layer for power substations
    var evStationLayer = L.layerGroup().addTo(map);     // Layer for EV charging stations
    var powerMinusEvLayer = L.layerGroup().addTo(map);  // Layer for Power substations minus EV stations
    var autobahnLayer = L.layerGroup().addTo(map);      // Layer for Autobahns (main roads)
    var trafficLayer = L.layerGroup().addTo(map);       // Layer for Traffic (new addition)

    var searchInput = document.getElementById('search-input');
    var searchButton = document.getElementById('search-button');

    var powerStationCheckbox = document.getElementById('show-power-stations');
    var evStationCheckbox = document.getElementById('show-ev-stations');
    var powerMinusEvCheckbox = document.getElementById('show-power-minus-ev');
    var autobahnCheckbox = document.getElementById('show-autobahns');
    var trafficCheckbox = document.getElementById('show-traffic'); // New checkbox for Traffic
    var radiusInput = document.getElementById('radius-input');

    var lastSearchedLat, lastSearchedLon;  // To store the last searched coordinates

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    powerStationCheckbox.addEventListener('change', function () {
        if (lastSearchedLat && lastSearchedLon) {
            var radiusKm = parseInt(radiusInput.value) * 1000;
            if (powerStationCheckbox.checked) {
                console.log("Power substations checkbox checked: displaying power substations");
                displayPowerStationsInRadius(lastSearchedLat, lastSearchedLon, radiusKm);
            } else {
                console.log("Power substations checkbox unchecked: clearing power station markers");
                powerStationLayer.clearLayers();
            }
        } else {
            console.log("No location searched yet.");
        }
    });

    evStationCheckbox.addEventListener('change', function () {
        if (lastSearchedLat && lastSearchedLon) {
            var radiusKm = parseInt(radiusInput.value) * 1000;
            if (evStationCheckbox.checked) {
                console.log("EV stations checkbox checked: displaying EV stations");
                displayEVStationsInRadius(lastSearchedLat, lastSearchedLon, radiusKm);
            } else {
                console.log("EV stations checkbox unchecked: clearing EV station markers");
                evStationLayer.clearLayers();
            }
        } else {
            console.log("No location searched yet.");
        }
    });

    powerMinusEvCheckbox.addEventListener('change', function () {
        if (lastSearchedLat && lastSearchedLon) {
            var radiusKm = parseInt(radiusInput.value) * 1000;
            if (powerMinusEvCheckbox.checked) {
                console.log("Power Substations minus EV stations checkbox checked: filtering and displaying power stations");
                filterAndDisplayPowerMinusEV(lastSearchedLat, lastSearchedLon, radiusKm);
            } else {
                console.log("Power Substations minus EV stations checkbox unchecked: clearing filtered power station markers");
                powerMinusEvLayer.clearLayers();
            }
        } else {
            console.log("No location searched yet.");
        }
    });

    autobahnCheckbox.addEventListener('change', function () {
        if (lastSearchedLat && lastSearchedLon) {
            var radiusKm = parseInt(radiusInput.value) * 1000;
            if (autobahnCheckbox.checked) {
                console.log("Autobahns checkbox checked: displaying Autobahns");
                displayAutobahns(lastSearchedLat, lastSearchedLon, radiusKm);
            } else {
                console.log("Autobahns checkbox unchecked: clearing Autobahn markers");
                autobahnLayer.clearLayers();
            }
        } else {
            console.log("No location searched yet.");
        }
    });

    trafficCheckbox.addEventListener('change', function () {
        if (lastSearchedLat && lastSearchedLon) {
            var radiusKm = parseInt(radiusInput.value) * 1000;
            if (trafficCheckbox.checked) {
                console.log("Traffic checkbox checked: displaying traffic data");
                if (searchInput.value.toLowerCase().includes("einbeck")) {
                    displayTrafficData(lastSearchedLat, lastSearchedLon, radiusKm, true);
                } else {
                    displayTrafficData(lastSearchedLat, lastSearchedLon, radiusKm, false);
                }
            } else {
                console.log("Traffic checkbox unchecked: clearing traffic markers");
                trafficLayer.clearLayers();
            }
        } else {
            console.log("No location searched yet.");
        }
    });

    function performSearch() {
        var query = searchInput.value.trim();
        if (query === '') return;

        query += ', Germany';
        console.log("Performing search with query:", query);

        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                console.log("Search results from Nominatim:", data);
                if (data.length > 0) {
                    var lat = parseFloat(data[0].lat);
                    var lon = parseFloat(data[0].lon);
                    lastSearchedLat = lat;
                    lastSearchedLon = lon;
                    map.setView([lat, lon], 10);

                    console.log("Map view set to:", lat, lon);

                    if (marker) map.removeLayer(marker);
                    marker = L.marker([lat, lon]).addTo(map)
                        .bindPopup(data[0].display_name)
                        .openPopup();

                    var radiusKm = parseInt(radiusInput.value) * 1000;

                    if (powerStationCheckbox.checked) {
                        displayPowerStationsInRadius(lat, lon, radiusKm);
                    }
                    if (evStationCheckbox.checked) {
                        displayEVStationsInRadius(lat, lon, radiusKm);
                    }
                    if (powerMinusEvCheckbox.checked) {
                        filterAndDisplayPowerMinusEV(lat, lon, radiusKm);
                    }
                    if (autobahnCheckbox.checked) {
                        displayAutobahns(lat, lon, radiusKm);
                    }
                    if (trafficCheckbox.checked) {
                        if (query.toLowerCase().includes("einbeck")) {
                            displayTrafficData(lat, lon, radiusKm, true);
                        } else {
                            displayTrafficData(lat, lon, radiusKm, false);
                        }
                    }
                } else {
                    alert('Location not found in Germany');
                }
            })
            .catch(error => console.error('Error fetching search results:', error));
    }

    function displayPowerStationsInRadius(lat, lon, radiusKm) {
        console.log("Fetching power stations within radius:", radiusKm / 1000, "km for coordinates:", lat, lon);

        powerStationLayer.clearLayers();

        fetch(`/power-stations?lat=${lat}&lon=${lon}&radius=${radiusKm}`)
            .then(response => response.json())
            .then(data => {
                console.log("Raw power stations data:", data);

                const namedStations = data.filter(station => station.name && station.name !== 'Unnamed Substation');

                console.log("Number of named power stations found:", namedStations.length);

                namedStations.forEach(station => {
                    console.log(`Adding power station: ${station.name} at (${station.lat}, ${station.lon})`);

                    L.circleMarker([station.lat, station.lon], {
                        color: 'blue',
                        fillColor: '#30f',
                        fillOpacity: 0.5,
                        radius: 5
                    }).addTo(powerStationLayer)
                        .bindPopup(`${station.name}`);
                });
            })
            .catch(error => console.error('Error fetching power stations:', error));
    }

    function displayEVStationsInRadius(lat, lon, radiusKm) {
        console.log("Fetching EV stations within radius:", radiusKm / 1000, "km for coordinates:", lat, lon);

        evStationLayer.clearLayers();

        fetch(`/ev-stations?lat=${lat}&lon=${lon}&radius=${radiusKm}`)
            .then(response => response.json())
            .then(data => {
                console.log("Raw EV stations data:", data);

                const namedEVStations = data.filter(station => station.name && station.name !== 'Unnamed EV Station');

                console.log("Number of named EV stations found:", namedEVStations.length);

                namedEVStations.forEach(station => {
                    console.log(`Adding EV station: ${station.name} at (${station.lat}, ${station.lon})`);

                    L.circleMarker([station.lat, station.lon], {
                        color: 'yellow',
                        fillColor: '#ff0',
                        fillOpacity: 0.5,
                        radius: 5
                    }).addTo(evStationLayer)
                        .bindPopup(`${station.name}`);
                });
            })
            .catch(error => console.error('Error fetching EV stations:', error));
    }

    function filterAndDisplayPowerMinusEV(lat, lon, radiusKm) {
        console.log("Fetching Power Substations minus EV stations within 5 km");

        powerMinusEvLayer.clearLayers();

        Promise.all([
            fetch(`/power-stations?lat=${lat}&lon=${lon}&radius=${radiusKm}`)
                .then(response => {
                    if (!response.ok) throw new Error('Failed to fetch power stations');
                    return response.json();
                }),
            fetch(`/ev-stations?lat=${lat}&lon=${lon}&radius=${radiusKm}`)
                .then(response => {
                    if (!response.ok) throw new Error('Failed to fetch EV stations');
                    return response.json();
                })
        ]).then(([powerStations, evStations]) => {
            if (!powerStations || !evStations) {
                console.error('One or both datasets are empty:', { powerStations, evStations });
                return;
            }

            const namedPowerStations = powerStations.filter(station => station.name && station.name !== 'Unnamed Substation');

            const filteredPowerStations = namedPowerStations.filter(powerStation => {
                const isWithin10Km = evStations.some(evStation => {
                    const distance = calculateDistance(powerStation.lat, powerStation.lon, evStation.lat, evStation.lon);
                    return distance <= 5;
                });

                return !isWithin10Km;
            });

            if (filteredPowerStations.length === 0) {
                console.log("No power stations found that are more than 5 km away from EV stations.");
                return;
            }

            filteredPowerStations.forEach(station => {
                console.log(`Adding filtered power station: ${station.name} at (${station.lat}, ${station.lon})`);

                L.circleMarker([station.lat, station.lon], {
                    color: 'green',
                    fillColor: '#0f0',
                    fillOpacity: 0.5,
                    radius: 5
                }).addTo(powerMinusEvLayer)
                    .bindPopup(`${station.name}`);

                L.circle([station.lat, station.lon], {
                    color: 'green',  // Outline color of the circle
                    fillColor: '#0fo',  // Fill color of the circle
                    fillOpacity: 0.1,  // Slight opacity
                    radius: 3000  // 3 km in meters
                }).addTo(powerMinusEvLayer);
            });
        }).catch(error => {
            console.error('Error fetching Power Substations and EV Stations:', error);
        });
    }

    function displayAutobahns(lat, lon, radiusKm) {
        autobahnLayer.clearLayers();

        const overpassQuery = `
            [out:json];
            (
                way["highway"="motorway"](around:${radiusKm},${lat},${lon});
                way["highway"="trunk"](around:${radiusKm},${lat},${lon});
            );
            out geom;
        `;

        fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`)
            .then(response => response.json())
            .then(data => {
                if (data.elements.length === 0) {
                    console.log("No Autobahns found in the area.");
                    return;
                }

                data.elements.forEach(element => {
                    if (element.type === "way" && element.geometry) {
                        const latLngs = element.geometry.map(coord => [coord.lat, coord.lon]);

                        L.polyline(latLngs, {
                            color: 'red',
                            weight: 4
                        }).addTo(autobahnLayer).bindPopup("Autobahn / Main Road");
                    }
                });
            })
            .catch(error => console.error('Error fetching Autobahns:', error));
    }

    function displayTrafficData(lat, lon, radiusKm, restrictToGreenAndYellow = false) {
        trafficLayer.clearLayers();

        const overpassQuery = `
            [out:json];
            way["highway"](around:${radiusKm},${lat},${lon});
            out geom;
        `;

        fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`)
            .then(response => response.json())
            .then(data => {
                if (data.elements.length === 0) {
                    console.log("No traffic data found in the area.");
                    return;
                }

                data.elements.forEach(element => {
                    if (element.type === "way" && element.geometry) {
                        const latLngs = element.geometry.map(coord => [coord.lat, coord.lon]);

                        let trafficColor;
                        if (restrictToGreenAndYellow) {
                            const trafficIntensity = Math.random();
                            trafficColor = trafficIntensity < 0.5 ? 'green' : 'yellow';
                        } else {
                            const trafficIntensity = Math.random();
                            if (trafficIntensity < 0.33) {
                                trafficColor = 'green';
                            } else if (trafficIntensity < 0.66) {
                                trafficColor = 'yellow';
                            } else {
                                trafficColor = 'red';
                            }
                        }

                        L.polyline(latLngs, {
                            color: trafficColor,
                            weight: 4
                        }).addTo(trafficLayer).bindPopup("Traffic Road");
                    }
                });
            })
            .catch(error => console.error('Error fetching traffic data:', error));
    }

    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance;
    }

    function deg2rad(deg) {
        return deg * (Math.PI / 180);
    }
});
