    // Controller
window.setSelectedCountry = function (country) {
    if (window.selectedCountry !== undefined) {
        window.selectedCountry = country;
        document.getElementById("country-select").value = "map";
        if (window.updateBarChart) updateBarChart();
    }

    if (window.selectedCountryPie !== undefined) {
        window.selectedCountryPie = country;
        document.getElementById("country-pie-select").value = "map";
        if (window.updatePieChart) updatePieChart();
    }
    };