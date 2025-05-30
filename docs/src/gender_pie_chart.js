function setupGenderPieChart(nobelData) {

    const validData = nobelData.filter(d => d.bornCountry);

    if (validData.length === 0) {
        console.error("No valid Nobel data (with bornCountry) found for Gender Pie Chart.");
        document.getElementById("genderpiechartdiv").innerHTML = "Error: No valid data found for Gender Pie Chart.";
        return;
    }
    
    const dropdown = document.getElementById("country-gender-pie-select");
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
        
        window.selectedCountryGenderPie = window.selectedCountryGenderPie || "All";

        const root = am5.Root.new("genderpiechartdiv");
        root.setThemes([am5themes_Animated.new(root)]);

        const chart = root.container.children.push(
            am5percent.PieChart.new(root, {
                layout: root.verticalLayout,
                innerRadius: am5.percent(40) 
            })
        );

        const series = chart.series.push(
            am5percent.PieSeries.new(root, {
                valueField: "value",
                categoryField: "gender" 
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

        window.updateGenderPieChart = function () {
            const dropdownEl = document.getElementById("country-gender-pie-select");
            const selected = dropdownEl.value;
            const country = selected === "map" ? window.selectedCountryGenderPie : selected;
            const category = window.selectedMapCategory || "all"; 

            const filtered = validData.filter((d) => {
                const countryMatch = country === "All" || d.bornCountry === country;
                
                const categoryMatch = category === "all" || (d.category && d.category.toLowerCase() === category);
                return countryMatch && categoryMatch; 
            });

            const grouped = {};
            filtered.forEach(d => {
                let genderCategory = d.gender ? d.gender.trim().toLowerCase() : '';
                if (genderCategory === 'female') genderCategory = 'Female';
                else if (genderCategory === 'male') genderCategory = 'Male';
                else genderCategory = d.organizationName ? 'Organization' : 'Unknown';
                grouped[genderCategory] = (grouped[genderCategory] || 0) + 1;
            });
            const chartData = Object.entries(grouped).map(([gender, value]) => ({
                gender,
                value
            }));
            series.data.setAll(chartData);
            legend.data.setAll(series.dataItems);
            series.appear(1000, 100);
        };

        document.getElementById("country-gender-pie-select").addEventListener("change", function () {
            const val = this.value;
            
            if (val !== "map") {
                window.selectedCountryGenderPie = val;
            }
            window.updateGenderPieChart();
        });

        window.updateGenderPieChart();

    }); 
}

if (typeof Papa !== 'undefined') {
    
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
                        console.error("Gender Pie Chart - PapaParse Errors:", results.errors);
                        document.getElementById("genderpiechartdiv").innerHTML = "Error: Could not parse Nobel data for Gender Pie Chart.";
                        return;
                    }
                    
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