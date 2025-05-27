/**
 * Sets up the Gender Pie Chart after Nobel data is loaded.
 * @param {Array} nobelData - Array of Nobel laureate objects from PapaParse.
 */
function setupGenderPieChart(nobelData) {

    // Filter data: We need entries with 'bornCountry'. We'll handle 'gender' later.
    const validData = nobelData.filter(d => d.bornCountry);

    if (validData.length === 0) {
        console.error("No valid Nobel data (with bornCountry) found for Gender Pie Chart.");
        document.getElementById("genderpiechartdiv").innerHTML = "Error: No valid data found for Gender Pie Chart.";
        return;
    }

    // --- Populate Dropdown ---
    const dropdown = document.getElementById("country-gender-pie-select");
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
        // Use a dedicated global variable for this chart's country selection
        window.selectedCountryGenderPie = window.selectedCountryGenderPie || "All";

        const root = am5.Root.new("genderpiechartdiv");
        root.setThemes([am5themes_Animated.new(root)]);

        const chart = root.container.children.push(
            am5percent.PieChart.new(root, {
                layout: root.verticalLayout,
                innerRadius: am5.percent(40) // Optional: Make it a donut chart
            })
        );

        const series = chart.series.push(
            am5percent.PieSeries.new(root, {
                valueField: "value",
                categoryField: "gender" // Use 'gender' as the category
            })
        );

        // Hide slice labels
        series.labels.template.set("forceHidden", true);
        series.ticks.template.set("forceHidden", true);

        // Configure tooltips
        series.slices.template.set("tooltipText", "{category}: {value} ({valuePercentTotal.formatNumber('0.0')}%)");

        // Add a legend
        const legend = chart.children.push(am5.Legend.new(root, {
            centerX: am5.percent(50),
            x: am5.percent(50),
            marginTop: 15,
            marginBottom: 15
        }));


        // ✅ Expose update function globally
        window.updateGenderPieChart = function () {
            const dropdownEl = document.getElementById("country-gender-pie-select");
            const selected = dropdownEl.value;
            // Use its dedicated global variable
            const country = selected === "map" ? window.selectedCountryGenderPie : selected;

            // Filter data based on selected country
            const filtered = validData.filter((d) =>
                country === "All" || d.bornCountry === country
            );

            // Group filtered data by gender and count laureates
            const grouped = {};
            filtered.forEach(d => {
                // Handle gender: check for 'male', 'female', or treat as 'Organization/Unknown'
                let genderCategory = d.gender ? d.gender.trim().toLowerCase() : '';
                if (genderCategory === 'female') {
                    genderCategory = 'Female';
                } else if (genderCategory === 'male') {
                    genderCategory = 'Male';
                } else {
                    // If no gender or not 'male'/'female', assume it's an organization or unknown.
                    // Check if 'organizationName' exists to be more specific.
                    genderCategory = d.organizationName ? 'Organization' : 'Unknown';
                }
                grouped[genderCategory] = (grouped[genderCategory] || 0) + 1; // Count +1
            });

            // Format data for the chart
            const chartData = Object.entries(grouped).map(([gender, value]) => ({
                gender,
                value
            }));

            // Set data to the series and legend
            series.data.setAll(chartData);
            legend.data.setAll(series.dataItems);

            // Animate the update
            series.appear(1000, 100);
        };

        // --- Event Listener ---
        document.getElementById("country-gender-pie-select").addEventListener("change", function () {
            const val = this.value;
            // Update its dedicated global variable
            if (val !== "map") {
                window.selectedCountryGenderPie = val;
            }
            window.updateGenderPieChart();
        });

        // --- Initial Render ---
        window.updateGenderPieChart();

    }); // end am5.ready()
}

// --- Data Loading using PapaParse ---
if (typeof Papa !== 'undefined') {
    // !! IMPORTANT: Replace 'nobel_laureates_data.csv' with the actual path.
    fetch('../nobel_laureates_data.csv')
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
                        console.error("Gender Pie Chart - PapaParse Errors:", results.errors);
                        document.getElementById("genderpiechartdiv").innerHTML = "Error: Could not parse Nobel data for Gender Pie Chart.";
                        return;
                    }
                    // Pass the loaded data to the setup function
                    setupGenderPieChart(results.data);
                },
                error: function(error) {
                    console.error('Gender Pie Chart - PapaParse Error:', error);
                    document.getElementById("genderpiechartdiv").innerHTML = `Error during parsing: ${error.message}`;
                }
            });
        })
        .catch(error => {
            console.error('Error loading Nobel data for Gender Pie Chart:', error);
            document.getElementById("genderpiechartdiv").innerHTML = `Error: Could not load data file. ${error.message}`;
        });
} else {
    console.error("PapaParse library not found! Ensure it's included in your HTML before gender_pie_chart.js.");
    document.getElementById("genderpiechartdiv").innerHTML = "Error: CSV Parsing library not loaded.";
}