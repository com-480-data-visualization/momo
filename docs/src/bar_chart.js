/**
 * Sets up the Bar Chart after Nobel data is loaded.
 * @param {Array} nobelData - Array of Nobel laureate objects from PapaParse.
 */
function setupBarChart(nobelData) {

    // Filter data: We need entries with a valid 'year' and 'bornCountry'.
    // We also filter out '0000' as a year, as it's often used for missing data.
    const validData = nobelData.filter(d => d.year && d.year !== '0000' && d.bornCountry);

    if (validData.length === 0) {
        console.error("No valid Nobel data (with year and bornCountry) found for Bar Chart.");
        document.getElementById("barchartdiv").innerHTML = "Error: No valid data found for Bar Chart.";
        return;
    }

    // --- Populate Dropdown ---
    const dropdown = document.getElementById("country-select");
    const countries = [...new Set(validData.map(d => d.bornCountry))]
        .filter(c => c) // Filter out any empty/undefined countries
        .sort();

    // Clear existing options except 'All' and 'map' before adding new ones
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
        // Global variable for country selection (ensure it's initialized)
        window.selectedCountry = window.selectedCountry || "All";

        const root = am5.Root.new("barchartdiv");
        root.setThemes([am5themes_Animated.new(root)]);

        const chart = root.container.children.push(
            am5xy.XYChart.new(root, {
                panX: true,
                panY: false, // Usually panY isn't needed for bar charts
                wheelX: "panX",
                wheelY: "zoomX",
                layout: root.verticalLayout,
                pinchZoomX:true // Allow pinch zoom on touch devices
            })
        );

        // Add cursor for better interaction
        chart.set("cursor", am5xy.XYCursor.new(root, {}));

        const xAxis = chart.xAxes.push(
            am5xy.CategoryAxis.new(root, {
                categoryField: "year",
                renderer: am5xy.AxisRendererX.new(root, {
                    minGridDistance: 40 // Adjust for label overlap
                }),
                tooltip: am5.Tooltip.new(root, {})
            })
        );
        // Rotate labels to prevent overlap
        xAxis.get("renderer").labels.template.setAll({
            rotation: -45,
            centerY: am5.p50,
            centerX: am5.p100,
            paddingRight: 10
        });


        const yAxis = chart.yAxes.push(
            am5xy.ValueAxis.new(root, {
                renderer: am5xy.AxisRendererY.new(root, {}),
                numberFormat: "#", // Ensure whole numbers for counts
                min: 0 // Start Y axis at 0
            })
        );
        // Add Y-axis title
        yAxis.children.moveValue(am5.Label.new(root, { text: "Number of Winners", rotation: -90, y: am5.p50, centerX: am5.p50 }), 0);

        const series = chart.series.push(
            am5xy.ColumnSeries.new(root, {
                name: "Winners",
                xAxis: xAxis,
                yAxis: yAxis,
                valueYField: "count", // Field for bar height
                categoryXField: "year", // Field for X-axis category
                tooltip: am5.Tooltip.new(root, {
                    labelText: "{categoryX}: {valueY} winner(s)" // Tooltip text
                })
            })
        );
        // Style columns
        series.columns.template.setAll({
            tooltipY: 0,
            cornerRadiusTL: 4,
            cornerRadiusTR: 4,
            strokeOpacity: 0
        });
        // Vary column colors (optional)
        series.columns.template.adapters.add("fill", function (fill, target) {
            return chart.get("colors").getIndex(series.columns.indexOf(target));
        });


        // ✅ Expose update function globally
         window.updateBarChart = function () {
            const countrySelectValue = document.getElementById("country-select").value;
            const country = countrySelectValue === "map" ? window.selectedCountry : countrySelectValue;
            const category = window.selectedMapCategory || "all"; // **获取全局类别**

            const filtered = validData.filter((d) => {
                const countryMatch = country === "All" || d.bornCountry === country;
                // **新增类别匹配**
                const categoryMatch = category === "all" || (d.category && d.category.toLowerCase() === category);
                return countryMatch && categoryMatch; // **同时满足**
            });

            // ... (后续的分组、排序、设置数据代码保持不变) ...
            const grouped = {};
            filtered.forEach((d) => {
                grouped[d.year] = (grouped[d.year] || 0) + 1;
            });
            let chartData = Object.entries(grouped).map(([year, count]) => ({
                year,
                count
            })).sort((a, b) => parseInt(a.year) - parseInt(b.year));
            xAxis.data.setAll(chartData);
            series.data.setAll(chartData);
            series.appear(1000);
            chart.appear(1000, 100);
        };

        // --- Event Listener ---
        document.getElementById("country-select").addEventListener("change", function () {
            const val = this.value;
            // Update the global variable only if a specific country is chosen from dropdown
            if (val !== "map") {
                window.selectedCountry = val;
            }
            window.updateBarChart(); // Trigger chart update
        });

        // --- Initial Render ---
        window.updateBarChart(); // Call once to load the initial view

    }); // end am5.ready()
}

// --- Data Loading using PapaParse ---
// Check if PapaParse is loaded before trying to use it
if (typeof Papa !== 'undefined') {
    // !! IMPORTANT: Replace 'nobel_laureates_data.csv' with the actual path.
    fetch('nobel_laureates_data.csv')
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
                        console.error("Bar Chart - PapaParse Errors:", results.errors);
                        document.getElementById("barchartdiv").innerHTML = "Error: Could not parse Nobel data for Bar Chart.";
                        return;
                    }
                    // Pass the loaded data to the setup function
                    setupBarChart(results.data);
                },
                error: function(error) {
                    console.error('Bar Chart - PapaParse Error:', error);
                    document.getElementById("barchartdiv").innerHTML = `Error during parsing: ${error.message}`;
                }
            });
        })
        .catch(error => {
            console.error('Error loading Nobel data for Bar Chart:', error);
            document.getElementById("barchartdiv").innerHTML = `Error: Could not load data file. ${error.message}`;
        });
} else {
    // Handle cases where PapaParse might not be loaded
    console.error("PapaParse library not found! Ensure it's included in your HTML before bar_chart.js.");
    document.getElementById("barchartdiv").innerHTML = "Error: CSV Parsing library not loaded.";
}