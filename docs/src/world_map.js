const countryNameToIdMap = {};
if (typeof am5geodata_worldLow !== 'undefined') {
    am5geodata_worldLow.features.forEach(feature => {
        countryNameToIdMap[feature.properties.name.toLowerCase()] = feature.id;
    });
} else {
    console.error("am5geodata_worldLow is not loaded! Map cannot be created.");
}

const manualBornToIdMap = {
    "USA": "US",
    "UK": "GB",
    "United Kingdom": "GB",
    "Scotland": "GB",
    "Northern Ireland": "GB",
    "England": "GB",
    "Russia": "RU",
    "Russian Federation": "RU",
    "the Netherlands": "NL",
    "Netherlands": "NL",
    "Democratic Republic of the Congo": "CD",
    "Dem. Rep. Congo": "CD",
    "Congo": "CD", 
    "Turkey": "TR",
    "Turkiye": "TR",
    "Czech Republic": "CZ",
    "Czech Rep.": "CZ",
    "East Timor": "TL",
    "Timor-Leste": "TL",
    "Guadeloupe Island": "FR", 
    "Faroe Islands (Denmark)": "DK", 
    "Germany": "DE",
    "France": "FR",
    "Japan": "JP",
    "Canada": "CA",
    "Sweden": "SE",
    "Switzerland": "CH",
    "Austria": "AT",
    "Italy": "IT",
    "Poland": "PL",
    "Norway": "NO",
    "Denmark": "DK",
    "Australia": "AU",
    "Belgium": "BE",
    "China": "CN",
    "India": "IN",
    "Spain": "ES",
    "Ireland": "IE",
    "Hungary": "HU",
    "Argentina": "AR",
    "South Africa": "ZA",
    "Egypt": "EG",
    "Israel": "IL"
};

const getCountryId = (bornCountry) => {
    if (!bornCountry) return null;
    
    let id = manualBornToIdMap[bornCountry];
    if (id) return id;
    
    id = manualBornToIdMap[bornCountry.toLowerCase()];
     if (id) return id;
    
    id = countryNameToIdMap[bornCountry.toLowerCase()];
    return id || null; 
};

am5.ready(function () {
    console.log("am5.ready: Starting World Map setup.");

    let nobelData = [];
    window.selectedMapYear = parseInt(document.getElementById("timeline-slider").value, 10);
    window.selectedMapCategory = "all";

    let root = am5.Root.new("chartdiv");
    root.setThemes([am5themes_Animated.new(root)]);

    let chart = root.container.children.push(am5map.MapChart.new(root, {
        panX: "translateX",
        panY: "translateY",
        projection: am5map.geoMercator(),
        homeZoomLevel: 1.2, 
        homeGeoPoint: { latitude: 30, longitude: 10 } 
    }));

    let polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
        geoJSON: am5geodata_worldLow,
        valueField: "value", 
        exclude: ["AQ"] 
    }));

    polygonSeries.mapPolygons.template.setAll({
        tooltipText: "{name}: {value} winner(s)", 
        toggleKey: "active",
        interactive: true,
        fill: am5.color(0xCCCCCC) 
    });

    polygonSeries.mapPolygons.template.states.create("hover", {
        fill: root.interfaceColors.get("primaryButtonHover") 
    });

    polygonSeries.mapPolygons.template.states.create("active", {
        fill: root.interfaceColors.get("primaryButton") 
    });

    polygonSeries.mapPolygons.template.adapters.add("fill", function (fill, target) {
        const dataItem = target.dataItem;
        
        if (dataItem && dataItem.get("value") !== undefined) {
            const value = dataItem.get("value", 0);

            if (value > 200) return am5.color(0x084594); 
            if (value > 100) return am5.color(0x2171B5); 
            if (value > 50) return am5.color(0x4292C6);  
            if (value > 20) return am5.color(0x6BAED6);  
            if (value > 5) return am5.color(0x9ECAE1);   
            if (value > 0) return am5.color(0xC6DBEF);   
        }
        
        return am5.color(0xCCCCCC);
    });

    let previousPolygon; 
    polygonSeries.mapPolygons.template.events.on("click", function (ev) {
        const target = ev.target; 
        const dataContext = target.dataItem.dataContext; 
        const countryName = dataContext.name; 

        let isNowActive; 

        if (previousPolygon && previousPolygon !== target) {
            previousPolygon.set("active", false);
        }

        if (target.get("active")) { 
            target.set("active", false);
            chart.goHome();
            window.setSelectedCountry("All");
            previousPolygon = undefined;
            isNowActive = false;
        } else { 
            target.set("active", true);
            polygonSeries.zoomToDataItem(target.dataItem);
            window.setSelectedCountry(countryName);
            previousPolygon = target;
            isNowActive = true;
        }

        let existingToast = document.body.querySelector('.click-toast-notification');
        if (existingToast) {
            existingToast.remove();
        }
        
        if (window.currentToastTimeout) clearTimeout(window.currentToastTimeout);
        if (window.currentToastRemovalTimeout) clearTimeout(window.currentToastRemovalTimeout);

        const toast = document.createElement('div');
        toast.className = 'click-toast-notification';

        let message = "";
        if (isNowActive) {
            message = `Stats for ${countryName} loaded below.`;
        } else {
            message = "Global statistics now showing.";
        }
        toast.textContent = message;

        document.body.appendChild(toast);

        if (ev.originalEvent) {
            toast.style.left = `${ev.originalEvent.pageX}px`;
            toast.style.top = `${ev.originalEvent.pageY}px`;
        } else {
            console.warn("originalEvent not available for toast positioning. Toast may be misplaced.");
            toast.style.left = '50vw'; 
            toast.style.top = '20vh';  
            toast.style.transform = 'translate(-50%, -50%)'; 
        }
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
        window.currentToastTimeout = setTimeout(() => {
            toast.classList.remove('show');
            
            window.currentToastRemovalTimeout = setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300); 
        }, 2500); 
    });

    chart.chartContainer.get("background").events.on("click", function () {
        chart.goHome();
        window.setSelectedCountry("All");
        if (previousPolygon) {
            previousPolygon.set("active", false);
            previousPolygon = undefined;
        }
    });

    chart.set("zoomControl", am5map.ZoomControl.new(root, {})).homeButton.set("visible", true);

    window.updateMap = function () {
        console.log(`Updating map. Year: ${window.selectedMapYear}, Cat: ${window.selectedMapCategory}`);

        const filtered = nobelData.filter(d =>
            (parseInt(d.year, 10) <= window.selectedMapYear) &&
            (window.selectedMapCategory === "all" || (d.category && d.category.toLowerCase() === window.selectedMapCategory)) &&
            d.bornCountry
        );

        const grouped = {};
        filtered.forEach(d => {
            grouped[d.bornCountry] = (grouped[d.bornCountry] || 0) + 1;
        });

        const mapData = [];
        let notFound = new Set();
        for (const countryName in grouped) {
            const id = getCountryId(countryName);
            if (id) {
                mapData.push({
                    id: id,
                    value: grouped[countryName]
                });
            } else {
                notFound.add(countryName); 
            }
        }
        if (notFound.size > 0) console.warn("Could not map countries:", [...notFound]);

        console.log("Setting Map Data (count:", mapData.length, ")");
        polygonSeries.data.setAll(mapData);
    };

    const slider = document.getElementById("timeline-slider");
    const yearDisplay = document.getElementById("current-year");
    if (slider && yearDisplay) {
        slider.addEventListener("input", () => { yearDisplay.textContent = slider.value; });
        slider.addEventListener("change", () => {
            window.selectedMapYear = parseInt(slider.value, 10);
            window.updateMap();
        });
    }

 const categoryFilterDiv = document.querySelector(".category-filter"); 
        const dropdownToggle = document.querySelector(".category-filter .dropdown-toggle");
        const dropdownMenu = document.querySelector(".category-filter .dropdown-menu");

        if (categoryFilterDiv && dropdownToggle && dropdownMenu) {
            dropdownToggle.addEventListener('click', (e) => {
                e.stopPropagation(); 
                dropdownMenu.classList.toggle('show'); 
            });
            
            dropdownMenu.addEventListener("click", (e) => {
                if (e.target.classList.contains("dropdown-item")) {
                    e.stopPropagation(); 
                    window.selectedMapCategory = e.target.getAttribute("data-category");
                    dropdownToggle.textContent = e.target.textContent; 
                    window.updateMap(); 
                    if (window.updateBarChart) window.updateBarChart();
                    if (window.updatePieChart) window.updatePieChart();
                    if (window.updateGenderPieChart) window.updateGenderPieChart();
                    if (window.updateAwardAgeHistogramChart) window.updateAwardAgeHistogramChart();

                    dropdownMenu.classList.remove('show'); 
                }
            });

            window.addEventListener('click', function(event) {
                if (!categoryFilterDiv.contains(event.target)) {
                    if (dropdownMenu.classList.contains('show')) {
                        dropdownMenu.classList.remove('show');
                    }
                }
            });

        } else {
            console.warn("Category filter elements not found. Dropdown will not work.");
        }

    console.log("Attempting to load data...");
    if (typeof Papa !== 'undefined') {
        const dataPath = window.location.pathname.includes('/momo/') 
            ? '/momo/nobel_laureates_data.csv' 
            : '../nobel_laureates_data.csv';
        fetch(dataPath) 
            .then(response => {
                if (!response.ok) throw new Error(`Workspace failed: ${response.statusText}`);
                return response.text();
            })
            .then(csvText => {
                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: function(results) {
                        if (results.errors.length > 0) {
                            console.error("PapaParse Errors:", results.errors);
                            throw new Error("CSV Parsing failed.");
                        }
                        nobelData = results.data;
                        console.log("Data loaded (", nobelData.length, "rows). Performing initial map update.");
                        window.updateMap(); 
                    }
                });
            })
            .catch(error => {
                console.error('Error loading or parsing Nobel data:', error);
                document.getElementById("chartdiv").innerHTML = `Error loading data. ${error.message}`;
            });
    } else {
        console.error("PapaParse library not found!");
        document.getElementById("chartdiv").innerHTML = "Error: CSV Parsing library not loaded.";
    }

    chart.appear(1000, 100);
    console.log("am5.ready: World Map setup complete.");
});