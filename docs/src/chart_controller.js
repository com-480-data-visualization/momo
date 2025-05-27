// Controller
window.setSelectedCountry = function (countryFromMap) {

    window.updateCountryDisplay(countryFromMap);

    // --- 国家名称映射逻辑 ---
    const countryNameMap = {
        "United States": "USA",
    };

    // 应用映射：如果countryFromMap在映射表中，则使用映射后的值，否则使用原始值
    const country = countryNameMap[countryFromMap] || countryFromMap;
    // -------------------------

    console.log(`Map selected: ${countryFromMap}, Using for filter: ${country}`); // 调试信息

    // 更新柱状图 (Bar Chart)
    // 假设您有一个 window.selectedCountry 变量用于柱状图
    // 注意：原始代码中的 if (window.selectedCountry !== undefined) 检查可能需要审查。
    // 它似乎是想检查变量是否存在，但通常我们直接赋值。
    // 这里我们保留您的结构，但请确保这些全局变量在使用前已在各自的图表JS中初始化。
    window.selectedCountry = country; // 直接设置（或根据您的逻辑）
    const barSelect = document.getElementById("country-select");
    if (barSelect) {
        barSelect.value = "map";
        // 确保 'map' 选项是可选的，或者临时启用它
        const mapOption = barSelect.querySelector('option[value="map"]');
        if (mapOption) mapOption.disabled = false;
        barSelect.value = "map"; // 再次设置以确保显示
        if (mapOption) mapOption.disabled = true; // 之后可以再次禁用
    }
    if (window.updateBarChart) window.updateBarChart();


    // 更新类别饼图 (Category Pie Chart)
    window.selectedCountryPie = country;
    const pieSelect = document.getElementById("country-pie-select");
     if (pieSelect) {
        const mapOption = pieSelect.querySelector('option[value="map"]');
        if (mapOption) mapOption.disabled = false;
        pieSelect.value = "map";
        if (mapOption) mapOption.disabled = true;
    }
    if (window.updatePieChart) window.updatePieChart();


    // 更新性别饼图 (Gender Pie Chart)
    // 假设性别饼图也使用 window.selectedCountryPie，或者您可以为其创建新变量
    window.selectedCountryGenderPie = country; // 建议使用独立的变量
    const genderSelect = document.getElementById("country-gender-pie-select");
    if (genderSelect) {
        const mapOption = genderSelect.querySelector('option[value="map"]');
        if (mapOption) mapOption.disabled = false;
        genderSelect.value = "map";
        if (mapOption) mapOption.disabled = true;
    }
    // 确保您的 gender_pie_chart.js 中有 updateGenderPieChart 函数
    if (window.updateGenderPieChart) window.updateGenderPieChart();


    // 更新年龄直方图 (Age at Award Histogram)
    window.selectedCountryAwardAgeHistogram = country;
    const ageSelect = document.getElementById("country-award-age-histogram-select");
     if (ageSelect) {
        const mapOption = ageSelect.querySelector('option[value="map"]');
        if (mapOption) mapOption.disabled = false;
        ageSelect.value = "map";
        if (mapOption) mapOption.disabled = true;
    }
    // 确保您的 award_age_histogram.js 中有 updateAwardAgeHistogramChart 函数
    if (window.updateAwardAgeHistogramChart) window.updateAwardAgeHistogramChart();
};

window.updateCountryDisplay = function(countryName) {
    const displayElement = document.getElementById("current-country-display");
    if (displayElement) {
        // 如果是 'All' 或空，显示 'All Countries'，否则显示国家名称。
        const displayName = (countryName === "All" || !countryName) ? "All Countries" : countryName;
        displayElement.textContent = "Selected: " + displayName;
    }
};