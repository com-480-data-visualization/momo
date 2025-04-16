am5.ready(function () {
    // Global variable to be updated by map
    window.selectedCountryPie = "All";

    // Mock data — grouped by type + country
    const allData = [
        { type: "Physics", country: "United States", value: 5 },
        { type: "Chemistry", country: "United States", value: 2 },
        { type: "Peace", country: "Germany", value: 3 },
        { type: "Literature", country: "France", value: 4 },
        { type: "Peace", country: "France", value: 1 },
        { type: "Physics", country: "Germany", value: 2 },
        { type: "Physics", country: "UK", value: 3 }
    ];

    const root = am5.Root.new("piechartdiv");
    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(
        am5percent.PieChart.new(root, {
            layout: root.verticalLayout
        })
    );

    const series = chart.series.push(
        am5percent.PieSeries.new(root, {
            valueField: "value",
            categoryField: "category"
        })
    );

    // ✅ Expose this function globally so it can be called from the map
    window.updatePieChart = function () {
        const dropdown = document.getElementById("country-pie-select");
        const selected = dropdown.value;
        const country = selected === "map" ? window.selectedCountryPie : selected;
    
        const filtered = allData.filter((d) =>
            country === "All" || d.country === country
        );
    
        const grouped = {};
        filtered.forEach(d => {
            grouped[d.type] = (grouped[d.type] || 0) + d.value;
        });
    
        const chartData = Object.entries(grouped).map(([category, value]) => ({
            category,
            value
        }));
    
        series.data.setAll(chartData);
        series.appear(1000, 100);
    };

    // Initial render
    window.updatePieChart();

    // Dropdown listener
    document.getElementById("country-pie-select").addEventListener("change", function () {
        const val = this.value;
        window.selectedCountryPie = val === "map" ? window.selectedCountryPie : val;
        window.updatePieChart();
    });
});