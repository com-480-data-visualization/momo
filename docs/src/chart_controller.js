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

    // Update for Gender Pie Chart
    if (window.selectedCountryPie !== undefined) { // Assuming we reuse selectedCountryPie
        // If you created a new global variable for gender pie chart country selection, use that instead.
        // For example: window.selectedCountryGenderPie = country;
        // And update the corresponding dropdown:
        // document.getElementById("country-gender-pie-select").value = "map"; 
        // For now, we are reusing selectedCountryPie and the existing pie chart's dropdown updates
        // will suffice if we want both pie charts to react to the same country selection from the map.
        // If separate country selection for the gender pie chart (when map is clicked) is desired,
        // this logic needs to be more distinct.
        // For now, let's assume the gender pie chart also uses "country-pie-select" for map updates.
        // If "country-gender-pie-select" should also be set to "map", that needs to be added.
        document.getElementById("country-gender-pie-select").value = "map"; // Added this line
        if (window.updateGenderPieChart) window.updateGenderPieChart();
    }

    // Add support for the new Age at Award Histogram chart
    if (window.selectedCountryAwardAgeHistogram !== undefined) {
        window.selectedCountryAwardAgeHistogram = country;
        document.getElementById("country-award-age-histogram-select").value = "map";
        if (window.updateAwardAgeHistogramChart) window.updateAwardAgeHistogramChart();
    }
    };