am5.ready(function () {
    // Global variable to be updated by map
    // Attempting to reuse window.selectedCountryPie, may need adjustment later
    // window.selectedCountryPie = "All"; // This might be shared or needs to be distinct

    // Mock data — grouped by type + country + gender
    const allData = [
        { type: "Physics", country: "United States", gender: "Male", value: 3 },
        { type: "Physics", country: "United States", gender: "Female", value: 2 },
        { type: "Chemistry", country: "United States", gender: "Male", value: 1 },
        { type: "Chemistry", country: "United States", gender: "Female", value: 1 },
        { type: "Peace", country: "Germany", gender: "Male", value: 2 },
        { type: "Peace", country: "Germany", gender: "Female", value: 1 },
        { type: "Literature", country: "France", gender: "Male", value: 2 },
        { type: "Literature", country: "France", gender: "Female", value: 2 },
        { type: "Peace", country: "France", gender: "Female", value: 1 },
        { type: "Physics", country: "Germany", gender: "Male", value: 2 },
        { type: "Physics", country: "UK", gender: "Male", value: 2 },
        { type: "Physics", country: "UK", gender: "Female", value: 1 }
    ];

    const root = am5.Root.new("genderpiechartdiv");
    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(
        am5percent.PieChart.new(root, {
            layout: root.verticalLayout
        })
    );

    const series = chart.series.push(
        am5percent.PieSeries.new(root, {
            valueField: "value",
            categoryField: "gender" // Changed from "category"
        })
    );

    // Expose this function globally so it can be called from the map
    window.updateGenderPieChart = function () {
        const dropdown = document.getElementById("country-gender-pie-select"); // Changed ID
        const selected = dropdown.value;
        // Using window.selectedCountryPie for now
        const country = selected === "map" ? window.selectedCountryPie : selected; 
    
        const filtered = allData.filter((d) =>
            country === "All" || d.country === country
        );
    
        const grouped = {};
        filtered.forEach(d => {
            grouped[d.gender] = (grouped[d.gender] || 0) + d.value; // Changed from d.type
        });
    
        const chartData = Object.entries(grouped).map(([gender, value]) => ({ // Changed from category
            gender,
            value
        }));
    
        series.data.setAll(chartData);
        series.appear(1000, 100);
    };

    // Initial render
    window.updateGenderPieChart();

    // Dropdown listener
    document.getElementById("country-gender-pie-select").addEventListener("change", function () { // Changed ID
        const val = this.value;
        // Using window.selectedCountryPie for now
        window.selectedCountryPie = val === "map" ? window.selectedCountryPie : val; 
        window.updateGenderPieChart();
    });
});
