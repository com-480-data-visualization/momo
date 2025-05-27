/**
 * Sets up the Award Age Histogram Chart after Nobel data is loaded and processed.
 * @param {Array} processedNobelData - Array of Nobel laureate objects with calculated age.
 */
function setupHistogramChart(processedNobelData) {

    // Filter data: We need entries with 'bornCountry' and valid 'ageAtAward'.
    // We also only want individuals, not organizations (check for gender).
    const validData = processedNobelData.filter(d =>
        d.bornCountry &&
        d.ageAtAward > 0 && d.ageAtAward < 120 && // Filter for reasonable ages
        d.gender && (d.gender.toLowerCase() === 'male' || d.gender.toLowerCase() === 'female') // Only individuals
    );

    if (validData.length === 0) {
        console.error("No valid Nobel data (with age and country) found for Histogram.");
        document.getElementById("awardAgeHistogramDiv").innerHTML = "Error: No valid data for Histogram.";
        return;
    }

    // --- Populate Dropdown ---
    const dropdown = document.getElementById("country-award-age-histogram-select");
    const countries = [...new Set(validData.map(d => d.bornCountry))]
        .filter(c => c)
        .sort();

    // Clear existing options except 'All' and 'map'
    while (dropdown.options.length > 2) {
       dropdown.remove(2);
    }
    countries.forEach(country => {
        const option = document.createElement("option");
        option.value = country;
        option.text = country;
        dropdown.add(option);
    });

    // --- amCharts Setup ---
    am5.ready(function () {
        // Global variable
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

        // ✅ Expose update function globally
        window.updateAwardAgeHistogramChart = function () {
           const dropdownEl = document.getElementById("country-award-age-histogram-select");
            const selected = dropdownEl.value;
            const country = selected === "map" ? window.selectedCountryAwardAgeHistogram : selected;
            const category = window.selectedMapCategory || "all"; // **获取全局类别**

            const filteredLaureates = validData.filter(laureate => {
                const countryMatch = country === "All" || laureate.bornCountry === country;
                // **新增类别匹配**
                const categoryMatch = category === "all" || (laureate.category && laureate.category.toLowerCase() === category);
                // 确保其他条件也满足
                return countryMatch && categoryMatch && !isNaN(laureate.ageAtAward) &&
                       laureate.ageAtAward > 0 && laureate.ageAtAward < 120 &&
                       laureate.gender && (laureate.gender.toLowerCase() === 'male' || laureate.gender.toLowerCase() === 'female');
            });

            // Data binning setup
            const binSize = 10;
            const minAge = Math.floor(Math.min(...filteredLaureates.map(l => l.ageAtAward)) / binSize) * binSize;
            const maxAgeCalc = Math.ceil(Math.max(...filteredLaureates.map(l => l.ageAtAward)) / binSize) * binSize;
            const maxAge = Math.max(minAge + binSize, maxAgeCalc); // Ensure at least one bin
            const ageBins = {};

            // Initialize bins only if there's data
            if (filteredLaureates.length > 0) {
                 for (let i = minAge; i < maxAge; i += binSize) {
                    ageBins[`${i}-${i + binSize - 1}`] = 0;
                 }
            }


            // Fill bins
            filteredLaureates.forEach(laureate => {
                const age = laureate.ageAtAward;
                const binStart = Math.floor(age / binSize) * binSize;
                const binLabel = `${binStart}-${binStart + binSize - 1}`;
                if (ageBins[binLabel] !== undefined) {
                    ageBins[binLabel]++;
                }
            });

            // Format for chart and sort
            const chartData = Object.entries(ageBins)
                .map(([ageBin, count]) => ({ ageBin, count }))
                .sort((a, b) => parseInt(a.ageBin.split("-")[0]) - parseInt(b.ageBin.split("-")[0]));

            // Update chart
            xAxis.data.setAll(chartData);
            series.data.setAll(chartData);
            series.appear(1000);
            chart.appear(1000, 100);
        };

        // --- Event Listener ---
        document.getElementById("country-award-age-histogram-select").addEventListener("change", function () {
            const val = this.value;
            if (val !== "map") {
                window.selectedCountryAwardAgeHistogram = val;
            }
            window.updateAwardAgeHistogramChart();
        });

        // --- Initial Render ---
        window.updateAwardAgeHistogramChart(); // Call once with initial 'All' data

    }); // end am5.ready()
}

// --- Data Loading and Pre-processing using PapaParse ---
if (typeof Papa !== 'undefined') {
    // !! IMPORTANT: Replace 'nobel_laureates_data.csv' with the actual path.
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

                    // Pre-process: Calculate age
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
                            laureate.ageAtAward = NaN; // Mark as invalid
                        }
                        //  // **** 添加或取消注释这部分 ****
                        // if (laureate.bornCountry === "China") {
                        //     console.log("China Data (Before Filter):", {
                        //         fullName: laureate.fullName,
                        //         born: laureate.born,
                        //         year: laureate.year,
                        //         parsedBornYear: bornYear,
                        //         awardYear: awardYear,
                        //         ageAtAward: laureate.ageAtAward,
                        //         gender: laureate.gender
                        //     });
                        // }
                        return laureate;
                    });

                    // Pass the processed data to the setup function
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