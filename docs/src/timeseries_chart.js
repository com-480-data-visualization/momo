// Time Series Chart for Nobel Prize Winners
let timeSeriesChart;
let timeSeriesData = [];

// Load and process data for time series
async function loadTimeSeriesData() {
    try {
        const response = await fetch('../nobel_laureates_data.csv');
        const csvText = await response.text();
        
        // Parse CSV data
        const lines = csvText.split('\n');
        const headers = lines[0].split(',');
        
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = lines[i].split(',');
                const row = {};
                headers.forEach((header, index) => {
                    row[header.trim()] = values[index] ? values[index].trim() : '';
                });
                data.push(row);
            }
        }
        
        return data;
    } catch (error) {
        console.error('Error loading data:', error);
        return [];
    }
}

// Process data for time series visualization
function processTimeSeriesData(data) {
    const yearlyData = {};
    const categories = ['physics', 'chemistry', 'medicine', 'literature', 'peace', 'economics'];
    
    // Initialize years from 1900 to 2024
    for (let year = 1900; year <= 2024; year++) {
        yearlyData[year] = {
            year: year,
            total: 0,
            physics: 0,
            chemistry: 0,
            medicine: 0,
            literature: 0,
            peace: 0,
            economics: 0
        };
    }
    
    // Count prizes by year and category
    data.forEach(row => {
        const year = parseInt(row.year);
        const category = row.category ? row.category.toLowerCase() : '';
        
        if (year >= 1900 && year <= 2024 && categories.includes(category)) {
            yearlyData[year][category]++;
            yearlyData[year].total++;
        }
    });
    
    return Object.values(yearlyData);
}

// Create time series chart
function createTimeSeriesChart(data) {
    // Dispose existing chart
    if (timeSeriesChart) {
        timeSeriesChart.dispose();
    }
    
    // Create root element
    const root = am5.Root.new("timeserieschartdiv");
    
    // Set themes
    root.setThemes([
        am5themes_Animated.new(root)
    ]);
    
    // Create chart
    const chart = root.container.children.push(am5xy.XYChart.new(root, {
        panX: true,
        panY: false,
        wheelX: "panX",
        wheelY: "zoomX",
        pinchZoomX: true,
        paddingLeft: 0,
        paddingRight: 1
    }));
    
    // Add cursor
    const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
    cursor.lineY.set("visible", false);
    
    // Create axes
    const xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
        baseInterval: {
            timeUnit: "year",
            count: 1
        },
        renderer: am5xy.AxisRendererX.new(root, {
            minorGridEnabled: true
        }),
        tooltip: am5.Tooltip.new(root, {})
    }));
    
    const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {
            strokeDasharray: [1, 3]
        })
    }));
    
    // Color scheme for categories
    const colors = {
        total: am5.color("#2E86AB"),
        physics: am5.color("#A23B72"),
        chemistry: am5.color("#F18F01"),
        medicine: am5.color("#C73E1D"),
        literature: am5.color("#592E83"),
        peace: am5.color("#1B998B"),
        economics: am5.color("#F4A261")
    };
    
    // Create series for each category
    const categories = ['total', 'physics', 'chemistry', 'medicine', 'literature', 'peace', 'economics'];
    const series = {};
    
    categories.forEach(category => {
        const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
        
        series[category] = chart.series.push(am5xy.LineSeries.new(root, {
            name: categoryName,
            xAxis: xAxis,
            yAxis: yAxis,
            valueYField: category,
            valueXField: "date",
            legendValueText: "{valueY}",
            stroke: colors[category],
            tooltip: am5.Tooltip.new(root, {
                pointerOrientation: "horizontal",
                labelText: "{name}: {valueY} prizes in {valueX.formatDate('yyyy')}"
            })
        }));
        
        series[category].strokes.template.setAll({
            strokeWidth: category === 'total' ? 3 : 2,
            strokeDasharray: category === 'total' ? [] : [5, 5]
        });
        
        series[category].fills.template.setAll({
            visible: false
        });
        
        // Add circle bullet
        series[category].bullets.push(function () {
            const bulletCircle = am5.Circle.new(root, {
                radius: category === 'total' ? 4 : 3,
                fill: colors[category]
            });
            return am5.Bullet.new(root, {
                sprite: bulletCircle
            });
        });
    });
    
    // Process data for chart
    const chartData = data.map(d => ({
        date: new Date(d.year, 0, 1).getTime(),
        year: d.year,
        total: d.total,
        physics: d.physics,
        chemistry: d.chemistry,
        medicine: d.medicine,
        literature: d.literature,
        peace: d.peace,
        economics: d.economics
    }));
    
    // Set data
    categories.forEach(category => {
        series[category].data.setAll(chartData);
    });
    
    // Add legend
    const legend = chart.rightAxesContainer.children.push(am5.Legend.new(root, {
        width: 200,
        paddingLeft: 15,
        height: am5.percent(100)
    }));
    
    legend.data.setAll(chart.series.values);
    
    // Add scrollbar for navigation
    chart.set("scrollbarX", am5.Scrollbar.new(root, {
        orientation: "horizontal"
    }));
    
    chart.appear(1000, 100);
    
    timeSeriesChart = root;
    return root;
}

// Initialize time series chart
async function initTimeSeriesChart() {
    const data = await loadTimeSeriesData();
    timeSeriesData = processTimeSeriesData(data);
    createTimeSeriesChart(timeSeriesData);
}

// Category filter functionality
function updateTimeSeriesFilter() {
    const selectedCategories = [];
    const checkboxes = document.querySelectorAll('.timeseries-filter input[type="checkbox"]:checked');
    
    checkboxes.forEach(checkbox => {
        selectedCategories.push(checkbox.value);
    });
    
    if (timeSeriesChart && timeSeriesChart.container) {
        const chart = timeSeriesChart.container.children.getIndex(0);
        chart.series.each(function(series) {
            const categoryName = series.get("name").toLowerCase();
            const isVisible = selectedCategories.includes(categoryName) || selectedCategories.length === 0;
            series.set("visible", isVisible);
        });
    }
}

// Export functions for global access
window.initTimeSeriesChart = initTimeSeriesChart;
window.updateTimeSeriesFilter = updateTimeSeriesFilter; 