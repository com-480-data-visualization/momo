// Country Analysis Visualization for Nobel Prize Winners
let countryChart;
let countryData = [];
let allWinnersData = [];

// Load and process data for country analysis
async function loadCountryData() {
    try {
        const response = await fetch('nobel_laureates_data.csv');
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
        
        allWinnersData = data;
        return data;
    } catch (error) {
        console.error('Error loading data:', error);
        return [];
    }
}

// Process data for country visualization
function processCountryData(data) {
    const countryStats = {};
    const categories = ['physics', 'chemistry', 'medicine', 'literature', 'peace', 'economics'];
    
    data.forEach(row => {
        const country = row.bornCountry || 'Unknown';
        const category = row.category ? row.category.toLowerCase() : '';
        const year = parseInt(row.year);
        
        if (!countryStats[country]) {
            countryStats[country] = {
                country: country,
                total: 0,
                physics: 0,
                chemistry: 0,
                medicine: 0,
                literature: 0,
                peace: 0,
                economics: 0,
                winners: []
            };
        }
        
        if (categories.includes(category)) {
            countryStats[country][category]++;
            countryStats[country].total++;
            countryStats[country].winners.push({
                name: row.fullName,
                category: category,
                year: year,
                motivation: row.motivation,
                organization: row.organizationName,
                organizationCountry: row.organizationCountry
            });
        }
    });
    
    // Convert to array and sort by total
    return Object.values(countryStats)
        .filter(country => country.total > 0)
        .sort((a, b) => b.total - a.total);
}

// Create country bar chart
function createCountryChart(data) {
    // Dispose existing chart
    if (countryChart) {
        countryChart.dispose();
    }
    
    // Create root element
    const root = am5.Root.new("countrychartdiv");
    
    // Set themes
    root.setThemes([
        am5themes_Animated.new(root)
    ]);
    
    // Create chart
    const chart = root.container.children.push(am5xy.XYChart.new(root, {
        panX: false,
        panY: true,
        wheelX: "none",
        wheelY: "zoomY",
        layout: root.verticalLayout
    }));
    
    // Create axes
    const yAxis = chart.yAxes.push(am5xy.CategoryAxis.new(root, {
        categoryField: "country",
        renderer: am5xy.AxisRendererY.new(root, {
            minGridDistance: 20,
            inversed: true
        }),
        tooltip: am5.Tooltip.new(root, {})
    }));
    
    const xAxis = chart.xAxes.push(am5xy.ValueAxis.new(root, {
        min: 0,
        renderer: am5xy.AxisRendererX.new(root, {
            strokeDasharray: [1, 3]
        })
    }));
    
    // Create series
    const series = chart.series.push(am5xy.ColumnSeries.new(root, {
        name: "Nobel Prizes",
        xAxis: xAxis,
        yAxis: yAxis,
        valueXField: "total",
        categoryYField: "country",
        tooltip: am5.Tooltip.new(root, {
            pointerOrientation: "left",
            labelText: "{categoryY}: {valueX} prizes"
        })
    }));
    
    // Color scheme
    series.columns.template.setAll({
        fill: am5.color("#2E86AB"),
        stroke: am5.color("#ffffff"),
        strokeWidth: 1,
        cornerRadiusTR: 3,
        cornerRadiusBR: 3
    });
    
    // Add hover effects
    series.columns.template.states.create("hover", {
        fill: am5.color("#1B5E7A")
    });
    
    // Add click interaction for detailed view
    series.columns.template.onPrivate("width", function() {
        this.set("maxWidth", 50);
    });
    
    // Take top 12 countries for better visualization
    const topCountries = data.slice(0, 12);
    
    // Set data
    yAxis.data.setAll(topCountries);
    series.data.setAll(topCountries);
    
    // Add click event for detailed winner information
    series.columns.template.on("click", function(ev) {
        const dataItem = ev.target.dataItem;
        const countryData = dataItem.dataContext;
        showWinnerDetails(countryData);
    });
    
    chart.appear(1000, 100);
    
    countryChart = root;
    return root;
}

// Show detailed winner information
function showWinnerDetails(countryData) {
    const modal = document.getElementById('winner-modal');
    const modalContent = document.getElementById('modal-content');
    
    if (!modal || !modalContent) {
        createWinnerModal();
        return showWinnerDetails(countryData);
    }
    
    const winners = countryData.winners.sort((a, b) => b.year - a.year);
    
    let html = `
        <div class="modal-header">
            <h2>Nobel Prize Winners from ${countryData.country}</h2>
            <span class="close-modal">&times;</span>
        </div>
        <div class="modal-body">
            <div class="country-summary">
                <p><strong>Total Prizes:</strong> ${countryData.total}</p>
                <div class="category-breakdown">
                    <span class="category-item">Physics: ${countryData.physics}</span>
                    <span class="category-item">Chemistry: ${countryData.chemistry}</span>
                    <span class="category-item">Medicine: ${countryData.medicine}</span>
                    <span class="category-item">Literature: ${countryData.literature}</span>
                    <span class="category-item">Peace: ${countryData.peace}</span>
                    <span class="category-item">Economics: ${countryData.economics}</span>
                </div>
            </div>
            <div class="winners-list">
                <h3>All Winners (${winners.length})</h3>
                <div class="winners-grid">
    `;
    
    winners.forEach(winner => {
        html += `
            <div class="winner-card">
                <div class="winner-header">
                    <h4>${winner.name}</h4>
                    <span class="winner-year">${winner.year}</span>
                </div>
                <div class="winner-category">${winner.category.charAt(0).toUpperCase() + winner.category.slice(1)}</div>
                <div class="winner-motivation">${winner.motivation}</div>
                ${winner.organization ? `<div class="winner-org">${winner.organization}, ${winner.organizationCountry}</div>` : ''}
            </div>
        `;
    });
    
    html += `
                </div>
            </div>
        </div>
    `;
    
    modalContent.innerHTML = html;
    modal.style.display = 'block';
    
    // Add close event
    const closeBtn = modalContent.querySelector('.close-modal');
    closeBtn.onclick = function() {
        modal.style.display = 'none';
    };
    
    // Close when clicking outside
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// Create modal for winner details
function createWinnerModal() {
    const modal = document.createElement('div');
    modal.id = 'winner-modal';
    modal.className = 'modal';
    
    const modalContent = document.createElement('div');
    modalContent.id = 'modal-content';
    modalContent.className = 'modal-content';
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}

// Initialize country chart
async function initCountryChart() {
    console.log('Initializing country chart...');
    const data = await loadCountryData();
    console.log('Loaded data:', data.length, 'rows');
    countryData = processCountryData(data);
    console.log('Processed country data:', countryData.length, 'countries');
    console.log('Top 5 countries:', countryData.slice(0, 5));
    createCountryChart(countryData);
}

// Category filter for country chart
function updateCountryFilter() {
    const selectedCategory = document.querySelector('input[name="country-category"]:checked').value;
    
    if (selectedCategory === 'all') {
        createCountryChart(countryData);
    } else {
        const filteredData = countryData
            .filter(country => country[selectedCategory] > 0)
            .map(country => ({
                ...country,
                total: country[selectedCategory]
            }))
            .sort((a, b) => b.total - a.total);
        
        createCountryChart(filteredData);
    }
}

// Export functions for global access
window.initCountryChart = initCountryChart;
window.updateCountryFilter = updateCountryFilter; 