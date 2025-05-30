function setupChart(nobelData) {
    const validData = nobelData.filter(d => d.category && d.bornCountry);

    if (validData.length === 0) {
        console.error("No valid Nobel data with 'category' and 'bornCountry' found.");
        document.getElementById("piechartdiv").innerHTML = "Error: No valid data found in CSV.";
        return;
    }
    
    const dropdown = document.getElementById("country-pie-select");
    const countries = [...new Set(validData.map(d => d.bornCountry))]
        .filter(c => c) 
        .sort();

    countries.forEach(country => {
        const option = document.createElement("option");
        option.value = country;
        option.text = country;
        dropdown.add(option);
    });

    am5.ready(function () {
        
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
        
        window.updatePieChart = function () {
            const dropdownEl = document.getElementById("country-pie-select");
            const selected = dropdownEl.value;
            const country = selected === "map" ? window.selectedCountryPie : selected;

            console.log("Updating Pie Chart for:", country);

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

        
        document.getElementById("country-pie-select").addEventListener("change", function () {
            const val = this.value;
            if (val !== "map") {
                window.selectedCountryPie = val;
            }
            window.updatePieChart();
        });
        window.updatePieChart();
    }); 
}

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
                console.log("PapaParse Results:", results); 
                if (results.errors.length > 0) {
                    console.error("PapaParse Errors:", results.errors);
                    let errorMsg = "Error: Could not parse Nobel data.<br>";
                    results.errors.forEach(err => {
                        errorMsg += `- ${err.message} (Row: ${err.row})<br>`;
                    });
                    document.getElementById("piechartdiv").innerHTML = errorMsg;
                    return; 
                }

                const nobelLaureatesData = results.data;
                setupChart(nobelLaureatesData); 

            },
            error: function(error) { 
                 console.error('PapaParse Error:', error);
                 document.getElementById("piechartdiv").innerHTML = `Error during parsing: ${error.message}`;
            }
        });
    })
    .catch(error => {
        console.error('Error loading Nobel data:', error);
        document.getElementById("piechartdiv").innerHTML = `Error: Could not load data file. ${error.message}`;
    });