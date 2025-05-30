window.setSelectedCountry = function (countryFromMap) {

    window.updateCountryDisplay(countryFromMap);

    const countryNameMap = {
        "United States": "USA",
    };

    const country = countryNameMap[countryFromMap] || countryFromMap;
    
    console.log(`Map selected: ${countryFromMap}, Using for filter: ${country}`); 
    
    window.selectedCountry = country; 
    const barSelect = document.getElementById("country-select");
    if (barSelect) {
        barSelect.value = "map";
        
        const mapOption = barSelect.querySelector('option[value="map"]');
        if (mapOption) mapOption.disabled = false;
        barSelect.value = "map"; 
        if (mapOption) mapOption.disabled = true; 
    }
    if (window.updateBarChart) window.updateBarChart();

    window.selectedCountryPie = country;
    const pieSelect = document.getElementById("country-pie-select");
     if (pieSelect) {
        const mapOption = pieSelect.querySelector('option[value="map"]');
        if (mapOption) mapOption.disabled = false;
        pieSelect.value = "map";
        if (mapOption) mapOption.disabled = true;
    }
    if (window.updatePieChart) window.updatePieChart();

    window.selectedCountryGenderPie = country; 
    const genderSelect = document.getElementById("country-gender-pie-select");
    if (genderSelect) {
        const mapOption = genderSelect.querySelector('option[value="map"]');
        if (mapOption) mapOption.disabled = false;
        genderSelect.value = "map";
        if (mapOption) mapOption.disabled = true;
    }
    
    if (window.updateGenderPieChart) window.updateGenderPieChart();

    window.selectedCountryAwardAgeHistogram = country;
    const ageSelect = document.getElementById("country-award-age-histogram-select");
     if (ageSelect) {
        const mapOption = ageSelect.querySelector('option[value="map"]');
        if (mapOption) mapOption.disabled = false;
        ageSelect.value = "map";
        if (mapOption) mapOption.disabled = true;
    }
    
    if (window.updateAwardAgeHistogramChart) window.updateAwardAgeHistogramChart();
};

window.updateCountryDisplay = function(countryName) {
    const displayElement = document.getElementById("current-country-display");
    if (displayElement) {
        
        const displayName = (countryName === "All" || !countryName) ? "All Countries" : countryName;
        displayElement.textContent = "Selected: " + displayName;
    }
};