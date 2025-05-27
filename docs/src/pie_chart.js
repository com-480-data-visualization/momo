// Function to setup and run the chart logic (mostly unchanged)
function setupChart(nobelData) {

    // Filter out entries without a country or category RIGHT AFTER parsing
    const validData = nobelData.filter(d => d.category && d.bornCountry);

    if (validData.length === 0) {
        console.error("No valid Nobel data with 'category' and 'bornCountry' found.");
        document.getElementById("piechartdiv").innerHTML = "Error: No valid data found in CSV.";
        return;
    }

    // --- Populate Dropdown ---
    const dropdown = document.getElementById("country-pie-select");
    const countries = [...new Set(validData.map(d => d.bornCountry))]
        .filter(c => c) // Filter out any empty/undefined countries
        .sort();

    countries.forEach(country => {
        const option = document.createElement("option");
        option.value = country;
        option.text = country;
        dropdown.add(option);
    });

    // --- amCharts Setup ---
    am5.ready(function () {
        // Global variable
        window.selectedCountryPie = "All";

        const root = am5.Root.new("piechartdiv");
        root.setThemes([am5themes_Animated.new(root)]);

        const chart = root.container.children.push(
            am5percent.PieChart.new(root, {
                layout: root.verticalLayout,
                innerRadius: am5.percent(50)
            })
        );

        const series = chart.series.push(
            am5percent.PieSeries.new(root, {
                valueField: "value",
                categoryField: "category",
                alignLabels: false
            })
        );

        series.labels.template.set("forceHidden", true);
        series.ticks.template.set("forceHidden", true);
        series.slices.template.set("tooltipText", "{category}: {value} ({valuePercentTotal.formatNumber('0.0')}%)");

        const legend = chart.children.push(am5.Legend.new(root, {
            centerX: am5.percent(50),
            x: am5.percent(50),
            marginTop: 15,
            marginBottom: 15
        }));

        // ✅ Expose update function globally
        window.updatePieChart = function () {
            const dropdownEl = document.getElementById("country-pie-select");
            const selected = dropdownEl.value;
            const country = selected === "map" ? window.selectedCountryPie : selected;

            console.log("Updating Pie Chart for:", country);

            // Use 'validData' for filtering
            const filtered = validData.filter((d) =>
                country === "All" || d.bornCountry === country
            );

            const grouped = {};
            filtered.forEach(d => {
                grouped[d.category] = (grouped[d.category] || 0) + 1;
            });

            const chartData = Object.entries(grouped).map(([category, value]) => ({
                category,
                value
            }));

            series.data.setAll(chartData);
            legend.data.setAll(series.dataItems);
            series.appear(1000, 100);
        };

        // --- Event Listeners ---
        document.getElementById("country-pie-select").addEventListener("change", function () {
            const val = this.value;
            if (val !== "map") {
                window.selectedCountryPie = val;
            }
            window.updatePieChart();
        });

        // --- Initial Render ---
        window.updatePieChart();

    }); // end am5.ready()
}

// --- Data Loading using PapaParse ---
// !! IMPORTANT: Replace 'nobel_laureates_data.csv' with the actual path.
fetch('/momo/nobel_laureates_data.csv')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
    })
    .then(csvText => {
        // Use PapaParse to parse the CSV text
        Papa.parse(csvText, {
            header: true,        // Treat the first row as headers (creates objects)
            skipEmptyLines: true, // Ignore empty lines
            complete: function(results) { // Callback when parsing is done
                console.log("PapaParse Results:", results); // For debugging

                // Check for parsing errors
                if (results.errors.length > 0) {
                    console.error("PapaParse Errors:", results.errors);
                    let errorMsg = "Error: Could not parse Nobel data.<br>";
                    results.errors.forEach(err => {
                        errorMsg += `- ${err.message} (Row: ${err.row})<br>`;
                    });
                    document.getElementById("piechartdiv").innerHTML = errorMsg;
                    return; // Stop if there are errors
                }

                // 'results.data' contains the array of objects
                const nobelLaureatesData = results.data;
                setupChart(nobelLaureatesData); // Call setup with parsed data

            },
            error: function(error) { // Callback for fetch/read errors in PapaParse
                 console.error('PapaParse Error:', error);
                 document.getElementById("piechartdiv").innerHTML = `Error during parsing: ${error.message}`;
            }
        });
    })
    .catch(error => {
        console.error('Error loading Nobel data:', error);
        document.getElementById("piechartdiv").innerHTML = `Error: Could not load data file. ${error.message}`;
    });