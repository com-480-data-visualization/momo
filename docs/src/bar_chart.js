am5.ready(function () {
    // Make it global so the map can access it
    window.selectedCountry = "All";

    // Mock data — replace this with real data or load from a file
    const allData = [
        { year: "2010", type: "Physics", country: "United States", count: 5 },
        { year: "2010", type: "Peace", country: "Germany", count: 2 },
        { year: "2011", type: "Physics", country: "United States", count: 3 },
        { year: "2011", type: "Peace", country: "United States", count: 1 },
        { year: "2012", type: "Chemistry", country: "Germany", count: 4 },
        { year: "2012", type: "Literature", country: "France", count: 3 }
    ];

    const root = am5.Root.new("barchartdiv");
    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(
        am5xy.XYChart.new(root, {
            panX: true,
            panY: true,
            wheelX: "panX",
            wheelY: "zoomX",
            layout: root.verticalLayout
        })
    );

    const xAxis = chart.xAxes.push(
        am5xy.CategoryAxis.new(root, {
            categoryField: "year",
            renderer: am5xy.AxisRendererX.new(root, {}),
            tooltip: am5.Tooltip.new(root, {})
        })
    );

    const yAxis = chart.yAxes.push(
        am5xy.ValueAxis.new(root, {
            renderer: am5xy.AxisRendererY.new(root, {})
        })
    );

    const series = chart.series.push(
        am5xy.ColumnSeries.new(root, {
            name: "Winners",
            xAxis: xAxis,
            yAxis: yAxis,
            valueYField: "count",
            categoryXField: "year",
            tooltip: am5.Tooltip.new(root, {
                labelText: "{valueY} winners"
            })
        })
    );

    // Also expose this globally so setSelectedCountry can call it
    window.updateBarChart = function () {
        const selectedType = document.getElementById("type-select").value;
        const countrySelectValue = document.getElementById("country-select").value;
        const country = countrySelectValue === "map" ? window.selectedCountry : countrySelectValue;

        const filtered = allData.filter((d) => {
            return (selectedType === "All" || d.type === selectedType) &&
                   (country === "All" || d.country === country);
        });

        const grouped = {};
        filtered.forEach((d) => {
            grouped[d.year] = (grouped[d.year] || 0) + d.count;
        });

        const chartData = Object.entries(grouped).map(([year, count]) => ({
            year,
            count
        }));

        xAxis.data.setAll(chartData);
        series.data.setAll(chartData);
    };

    document.getElementById("type-select").addEventListener("change", window.updateBarChart);
    document.getElementById("country-select").addEventListener("change", window.updateBarChart);

    window.updateBarChart(); // Initial render
});