function setupHistogramChart(processedNobelData) {

    const validData = processedNobelData.filter(d =>
        d.bornCountry &&
        d.ageAtAward > 0 && d.ageAtAward < 120 && 
        d.gender && (d.gender.toLowerCase() === 'male' || d.gender.toLowerCase() === 'female') 
    );

    if (validData.length === 0) {
        console.error("No valid Nobel data (with age and country) found for Histogram.");
        document.getElementById("awardAgeHistogramDiv").innerHTML = "Error: No valid data for Histogram.";
        return;
    }

    const dropdown = document.getElementById("country-award-age-histogram-select");
    const countries = [...new Set(validData.map(d => d.bornCountry))]
        .filter(c => c)
        .sort();

    while (dropdown.options.length > 2) {
       dropdown.remove(2);
    }
    countries.forEach(country => {
        const option = document.createElement("option");
        option.value = country;
        option.text = country;
        dropdown.add(option);
    });

    am5.ready(function () {
        window.selectedCountryAwardAgeHistogram = window.selectedCountryAwardAgeHistogram || "All";

        const root = am5.Root.new("awardAgeHistogramDiv");
        root.setThemes([am5themes_Animated.new(root)]);

        const chart = root.container.children.push(
            am5xy.XYChart.new(root, {
                panX: true,
                panY: false,
                wheelX: "panX",
                wheelY: "zoomX",
                layout: root.verticalLayout,
                pinchZoomX: true
            })
        );

        let cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
        cursor.lineY.set("visible", false);

        const xAxis = chart.xAxes.push(
            am5xy.CategoryAxis.new(root, {
                categoryField: "ageBin",
                renderer: am5xy.AxisRendererX.new(root, {
                    cellStartLocation: 0.1,
                    cellEndLocation: 0.9,
                    minorGridEnabled: false
                }),
                tooltip: am5.Tooltip.new(root, {})
            })
        );
         xAxis.get("renderer").labels.template.setAll({
            rotation: -45,
            centerY: am5.p50,
            centerX: am5.p100,
            paddingRight: 10
        });

        const yAxis = chart.yAxes.push(
            am5xy.ValueAxis.new(root, {
                renderer: am5xy.AxisRendererY.new(root, {}),
                min: 0,
                numberFormat: "#"
            })
        );
        yAxis.children.moveValue(am5.Label.new(root, { text: "Number of Laureates", rotation: -90, y: am5.p50, centerX: am5.p50 }), 0);

        const series = chart.series.push(
            am5xy.ColumnSeries.new(root, {
                name: "Age at Award",
                xAxis: xAxis,
                yAxis: yAxis,
                valueYField: "count",
                categoryXField: "ageBin",
                sequencedInterpolation: true,
                tooltip: am5.Tooltip.new(root, {
                    labelText: "{categoryX}: {valueY} laureate(s)"
                })
            })
        );

        series.columns.template.setAll({
            cornerRadiusTL: 5,
            cornerRadiusTR: 5,
            strokeOpacity: 0
        });
        series.columns.template.adapters.add("fill", (fill, target) => chart.get("colors").getIndex(series.columns.indexOf(target)));
        series.columns.template.adapters.add("stroke", (stroke, target) => chart.get("colors").getIndex(series.columns.indexOf(target)));

        window.updateAwardAgeHistogramChart = function () {
           const dropdownEl = document.getElementById("country-award-age-histogram-select");
            const selected = dropdownEl.value;
            const country = selected === "map" ? window.selectedCountryAwardAgeHistogram : selected;
            const category = window.selectedMapCategory || "all"; 

            const filteredLaureates = validData.filter(laureate => {
                const countryMatch = country === "All" || laureate.bornCountry === country;
                const categoryMatch = category === "all" || (laureate.category && laureate.category.toLowerCase() === category);
                return countryMatch && categoryMatch && !isNaN(laureate.ageAtAward) &&
                       laureate.ageAtAward > 0 && laureate.ageAtAward < 120 &&
                       laureate.gender && (laureate.gender.toLowerCase() === 'male' || laureate.gender.toLowerCase() === 'female');
            });

            const binSize = 10;
            const minAge = Math.floor(Math.min(...filteredLaureates.map(l => l.ageAtAward)) / binSize) * binSize;
            const maxAgeCalc = Math.ceil(Math.max(...filteredLaureates.map(l => l.ageAtAward)) / binSize) * binSize;
            const maxAge = Math.max(minAge + binSize, maxAgeCalc);
            const ageBins = {};

            if (filteredLaureates.length > 0) {
                 for (let i = minAge; i < maxAge; i += binSize) {
                    ageBins[`${i}-${i + binSize - 1}`] = 0;
                 }
            }


            filteredLaureates.forEach(laureate => {
                const age = laureate.ageAtAward;
                const binStart = Math.floor(age / binSize) * binSize;
                const binLabel = `${binStart}-${binStart + binSize - 1}`;
                if (ageBins[binLabel] !== undefined) {
                    ageBins[binLabel]++;
                }
            });

            const chartData = Object.entries(ageBins)
                .map(([ageBin, count]) => ({ ageBin, count }))
                .sort((a, b) => parseInt(a.ageBin.split("-")[0]) - parseInt(b.ageBin.split("-")[0]));

            xAxis.data.setAll(chartData);
            series.data.setAll(chartData);
            series.appear(1000);
            chart.appear(1000, 100);
        };

        document.getElementById("country-award-age-histogram-select").addEventListener("change", function () {
            const val = this.value;
            if (val !== "map") {
                window.selectedCountryAwardAgeHistogram = val;
            }
            window.updateAwardAgeHistogramChart();
        });

        window.updateAwardAgeHistogramChart(); 

    }); 
}

if (typeof Papa !== 'undefined') {
    // Dynamic path that works both locally and on GitHub Pages
    const dataPath = window.location.pathname.includes('/momo/') 
        ? '/momo/nobel_laureates_data.csv' 
        : '../nobel_laureates_data.csv';
    fetch(dataPath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(csvText => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: function(results) {
                    if (results.errors.length > 0) {
                        console.error("Histogram - PapaParse Errors:", results.errors);
                        document.getElementById("awardAgeHistogramDiv").innerHTML = "Error: Could not parse Nobel data for Histogram.";
                        return;
                    }

                    const processedData = results.data.map(laureate => {
                        const awardYear = parseInt(laureate.year, 10);
                        let bornYear = NaN;
                        const bornString = laureate.born;
                        if (bornString && bornString !== "0000-00-00") {
                            const match = bornString.match(/\b(18\d{2}|19\d{2}|20\d{2})\b/);
                            if (match) {
                                bornYear = parseInt(match[0], 10);
                            }
                        }

                        if (!isNaN(awardYear) && !isNaN(bornYear) && bornYear > 0) {
                            laureate.ageAtAward = awardYear - bornYear;
                        } else {
                            laureate.ageAtAward = NaN; 
                        }
                        return laureate;
                    });

                    setupHistogramChart(processedData);
                },
                error: function(error) {
                    console.error('Histogram - PapaParse Error:', error);
                    document.getElementById("awardAgeHistogramDiv").innerHTML = `Error during parsing: ${error.message}`;
                }
            });
        })
        .catch(error => {
            console.error('Error loading Nobel data for Histogram:', error);
            document.getElementById("awardAgeHistogramDiv").innerHTML = `Error: Could not load data file. ${error.message}`;
        });
} else {
    console.error("PapaParse library not found! Ensure it's included in your HTML before award_age_histogram.js.");
    document.getElementById("awardAgeHistogramDiv").innerHTML = "Error: CSV Parsing library not loaded.";
}