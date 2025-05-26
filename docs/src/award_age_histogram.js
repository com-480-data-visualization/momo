am5.ready(function () {
    // Global variable to be updated by map or dropdown
    window.selectedCountryAwardAgeHistogram = "All";

    const root = am5.Root.new("awardAgeHistogramDiv");
    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(
        am5xy.XYChart.new(root, {
            panX: true,
            panY: true,
            wheelX: "panX",
            wheelY: "zoomX",
            layout: root.verticalLayout,
            pinchZoomX: true
        })
    );

    // Add cursor
    let cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
    cursor.lineY.set("visible", false);

    // Create X-axis
    const xAxis = chart.xAxes.push(
        am5xy.CategoryAxis.new(root, {
            categoryField: "ageBin",
            renderer: am5xy.AxisRendererX.new(root, {
                cellStartLocation: 0.1,
                cellEndLocation: 0.9,
                minorGridEnabled: false
            }),
            tooltip: am5.Tooltip.new(root, {})
        })
    );

    // Create Y-axis
    const yAxis = chart.yAxes.push(
        am5xy.ValueAxis.new(root, {
            renderer: am5xy.AxisRendererY.new(root, {}),
            min: 0
        })
    );
    yAxis.children.moveValue(
        am5.Label.new(root, { text: "Number of Laureates", rotation: -90, y: am5.p50, centerX: am5.p50 }),
        0
    );

    // Create series
    const series = chart.series.push(
        am5xy.ColumnSeries.new(root, {
            name: "Age at Award",
            xAxis: xAxis,
            yAxis: yAxis,
            valueYField: "count",
            categoryXField: "ageBin",
            sequencedInterpolation: true,
            tooltip: am5.Tooltip.new(root, {
                labelText: "{categoryX}: {valueY} laureates"
            })
        })
    );

    series.columns.template.setAll({
        cornerRadiusTL: 5,
        cornerRadiusTR: 5,
        strokeOpacity: 0
    });
    series.columns.template.adapters.add("fill", function (fill, target) {
        return chart.get("colors").getIndex(series.columns.indexOf(target));
    });
    series.columns.template.adapters.add("stroke", function (stroke, target) {
        return chart.get("colors").getIndex(series.columns.indexOf(target));
    });

    // Update function for the Award Age Histogram Chart.
    window.updateAwardAgeHistogramChart = function () {
        if (!window.allNobelLaureatesData || window.allNobelLaureatesData.length === 0) {
            console.warn("Nobel data not loaded yet for Award Age Histogram.");
            series.data.setAll([]);
            xAxis.data.setAll([]);
            return;
        }

        // Get the country filter value either from the dropdown or from the map filter
        const dropdown = document.getElementById("country-award-age-histogram-select");
        const selectedDropdownValue = dropdown ? dropdown.value : "All";
        const countryFilter =
            selectedDropdownValue === "map"
                ? window.selectedCountryAwardAgeHistogram
                : selectedDropdownValue;

        // Calculate age at award and filter valid entries
        const filteredLaureates = window.allNobelLaureatesData
            .filter(laureate => {
                const countryMatch = countryFilter === "All" || laureate.bornCountry === countryFilter;
                const hasAwardYear =
                    typeof laureate.awardYear === "number" && !isNaN(laureate.awardYear);
                const hasBornYear =
                    typeof laureate.parsedBornYear === "number" && !isNaN(laureate.parsedBornYear);
                return countryMatch && hasAwardYear && hasBornYear && laureate.gender !== "org";
            })
            .map(laureate => {
                const ageAtAward = laureate.awardYear - laureate.parsedBornYear;
                return { ...laureate, ageAtAward };
            })
            .filter(laureate => laureate.ageAtAward > 0 && laureate.ageAtAward < 120);

        // Data binning
        const binSize = 10;
        const minAge = 20;
        const maxAge = 100;
        const ageBins = {};

        for (let i = minAge; i < maxAge; i += binSize) {
            ageBins[`${i}-${i + binSize - 1}`] = 0;
        }
        ageBins[`${maxAge}+`] = 0; // For ages above or equal to maxAge

        filteredLaureates.forEach(laureate => {
            const age = laureate.ageAtAward;
            if (age >= maxAge) {
                ageBins[`${maxAge}+`]++;
            } else {
                for (let i = minAge; i < maxAge; i += binSize) {
                    if (age >= i && age < i + binSize) {
                        ageBins[`${i}-${i + binSize - 1}`]++;
                        break;
                    }
                }
            }
        });

        const chartData = Object.entries(ageBins)
            .map(([ageBin, count]) => ({
                ageBin,
                count
            }))
            .sort((a, b) => {
                const aMin = parseInt(a.ageBin.split("-")[0]) || maxAge;
                const bMin = parseInt(b.ageBin.split("-")[0]) || maxAge;
                return aMin - bMin;
            });

        series.data.setAll(chartData);
        xAxis.data.setAll(chartData);
        series.appear(1000);
        chart.appear(1000, 100);

        console.log("Fake data for testing:", window.allNobelLaureatesData);
        console.log("Chart data after processing:", series.data.values);
    };

    // Listen for dropdown changes to update the chart
    const dropdown = document.getElementById("country-award-age-histogram-select");
    if (dropdown) {
        dropdown.addEventListener("change", function () {
            const val = this.value;
            if (val !== "map") {
                window.selectedCountryAwardAgeHistogram = val;
            }
            window.updateAwardAgeHistogramChart();
        });
    }

    // Initial Render Logic
    if (window.allNobelLaureatesData && window.allNobelLaureatesData.length > 0) {
        window.updateAwardAgeHistogramChart();
    } else {
        document.addEventListener("nobelDataLoaded", function () {
            window.updateAwardAgeHistogramChart();
        });
        setTimeout(function () {
            if (series.data.length === 0 && window.allNobelLaureatesData && window.allNobelLaureatesData.length > 0) {
                window.updateAwardAgeHistogramChart();
            } else if (series.data.length === 0) {
                console.warn("Award Age Histogram: Data still not available after timeout.");
            }
        }, 2000);
    }

    // Temporary fake data for testing
    window.allNobelLaureatesData = [
        { bornCountry: "United States", awardYear: 2000, parsedBornYear: 1960, gender: "male" },
        { bornCountry: "United States", awardYear: 2010, parsedBornYear: 1970, gender: "female" },
        { bornCountry: "Germany", awardYear: 1995, parsedBornYear: 1950, gender: "male" },
        { bornCountry: "France", awardYear: 1980, parsedBornYear: 1940, gender: "female" },
        { bornCountry: "United States", awardYear: 2020, parsedBornYear: 1985, gender: "male" },
        { bornCountry: "Germany", awardYear: 2005, parsedBornYear: 1965, gender: "female" },
        { bornCountry: "France", awardYear: 1990, parsedBornYear: 1955, gender: "male" },
        { bornCountry: "United States", awardYear: 2015, parsedBornYear: 1980, gender: "female" }
    ];

    // Trigger the chart update with fake data
    window.updateAwardAgeHistogramChart();
});
