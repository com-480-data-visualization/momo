function setupBarChart(nobelData) {

    const validData = nobelData.filter(d => d.year && d.year !== '0000' && d.bornCountry);

    if (validData.length === 0) {
        console.error("No valid Nobel data (with year and bornCountry) found for Bar Chart.");
        document.getElementById("barchartdiv").innerHTML = "Error: No valid data found for Bar Chart.";
        return;
    }

    const dropdown = document.getElementById("country-select");
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
        window.selectedCountry = window.selectedCountry || "All";

        const root = am5.Root.new("barchartdiv");
        root.setThemes([am5themes_Animated.new(root)]);

        const chart = root.container.children.push(
            am5xy.XYChart.new(root, {
                panX: true,
                panY: false, 
                wheelX: "panX",
                wheelY: "zoomX",
                layout: root.verticalLayout,
                pinchZoomX:true 
            })
        );

        chart.set("cursor", am5xy.XYCursor.new(root, {}));

        const xAxis = chart.xAxes.push(
            am5xy.CategoryAxis.new(root, {
                categoryField: "year",
                renderer: am5xy.AxisRendererX.new(root, {
                    minGridDistance: 40 
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
                numberFormat: "#", 
                min: 0 
            })
        );
        
        yAxis.children.moveValue(am5.Label.new(root, { text: "Number of Winners", rotation: -90, y: am5.p50, centerX: am5.p50 }), 0);

        const series = chart.series.push(
            am5xy.ColumnSeries.new(root, {
                name: "Winners",
                xAxis: xAxis,
                yAxis: yAxis,
                valueYField: "count", 
                categoryXField: "year", 
                tooltip: am5.Tooltip.new(root, {
                    labelText: "{categoryX}: {valueY} winner(s)" 
                })
            })
        );
        
        series.columns.template.setAll({
            tooltipY: 0,
            cornerRadiusTL: 4,
            cornerRadiusTR: 4,
            strokeOpacity: 0
        });
        
        series.columns.template.adapters.add("fill", function (fill, target) {
            return chart.get("colors").getIndex(series.columns.indexOf(target));
        });
        
         window.updateBarChart = function () {
            const countrySelectValue = document.getElementById("country-select").value;
            const country = countrySelectValue === "map" ? window.selectedCountry : countrySelectValue;
            const category = window.selectedMapCategory || "all"; 

            const filtered = validData.filter((d) => {
                const countryMatch = country === "All" || d.bornCountry === country;
                
                const categoryMatch = category === "all" || (d.category && d.category.toLowerCase() === category);
                return countryMatch && categoryMatch; 
            });

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
        
        document.getElementById("country-select").addEventListener("change", function () {
            const val = this.value;
            
            if (val !== "map") {
                window.selectedCountry = val;
            }
            window.updateBarChart(); 
        });
        
        window.updateBarChart(); 

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
                        console.error("Bar Chart - PapaParse Errors:", results.errors);
                        document.getElementById("barchartdiv").innerHTML = "Error: Could not parse Nobel data for Bar Chart.";
                        return;
                    }
                    
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
    
    console.error("PapaParse library not found! Ensure it's included in your HTML before bar_chart.js.");
    document.getElementById("barchartdiv").innerHTML = "Error: CSV Parsing library not loaded.";
}