// Interactive Gender Analysis Visualization for Nobel Prize Winners
let interactiveGenderChart;
let interactiveGenderData = [];

// Calculate age from birth date and award year
function calculateAge(birthDate, awardYear) {
    if (!birthDate || birthDate === '0000-00-00' || !awardYear) return null;
    
    // Parse birth date (format: DD-MM-YYYY or YYYY-MM-DD or MM/DD/YYYY)
    let birthYear;
    if (birthDate.includes('-')) {
        const parts = birthDate.split('-');
        if (parts[0].length === 4) {
            birthYear = parseInt(parts[0]); // YYYY-MM-DD
        } else {
            birthYear = parseInt(parts[2]); // DD-MM-YYYY
        }
    } else if (birthDate.includes('/')) {
        const parts = birthDate.split('/');
        birthYear = parseInt(parts[2]); // MM/DD/YYYY
    } else {
        return null;
    }
    
    return awardYear - birthYear;
}

// Load and process data for interactive gender analysis
async function loadInteractiveGenderData() {
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
        
        return data;
    } catch (error) {
        console.error('Error loading data:', error);
        return [];
    }
}

// Process data for interactive scatter plot
function processInteractiveGenderData(data) {
    const categories = ['physics', 'chemistry', 'medicine', 'literature', 'peace', 'economics'];
    const processedData = [];
    
    data.forEach(row => {
        const category = row.category ? row.category.toLowerCase() : '';
        const gender = row.gender ? row.gender.toLowerCase() : '';
        const age = calculateAge(row.born, parseInt(row.year));
        
        if (categories.includes(category) && (gender === 'male' || gender === 'female') && age && age >= 20 && age <= 100) {
            processedData.push({
                name: row.fullName,
                category: category.charAt(0).toUpperCase() + category.slice(1),
                categoryIndex: categories.indexOf(category),
                gender: gender,
                age: age,
                year: parseInt(row.year),
                motivation: row.motivation,
                organization: row.organizationName,
                country: row.bornCountry,
                // Add some random jitter for better visualization
                categoryJitter: categories.indexOf(category) + (Math.random() - 0.5) * 0.6
            });
        }
    });
    
    return processedData;
}

// Create interactive gender scatter plot
function createInteractiveGenderChart(data) {
    // Dispose existing chart
    if (interactiveGenderChart) {
        interactiveGenderChart.dispose();
    }
    
    // Create root element
    const root = am5.Root.new("interactivegenderchartdiv");
    
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
        layout: root.verticalLayout
    }));
    
    // Add cursor
    const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
    cursor.lineY.set("visible", false);
    
    // Create axes
    const xAxis = chart.xAxes.push(am5xy.ValueAxis.new(root, {
        min: 20,
        max: 100,
        renderer: am5xy.AxisRendererX.new(root, {
            minGridDistance: 50
        }),
        tooltip: am5.Tooltip.new(root, {})
    }));
    
    xAxis.set("title", am5.Label.new(root, {
        text: "Age at Award",
        fontWeight: "bold"
    }));
    
    const yAxis = chart.yAxes.push(am5xy.CategoryAxis.new(root, {
        categoryField: "category",
        renderer: am5xy.AxisRendererY.new(root, {
            minGridDistance: 20,
            inversed: true
        }),
        tooltip: am5.Tooltip.new(root, {})
    }));
    
    // Set category data
    const categories = ['Physics', 'Chemistry', 'Medicine', 'Literature', 'Peace', 'Economics'];
    yAxis.data.setAll(categories.map(cat => ({ category: cat })));
    
    // Create male series
    const maleSeries = chart.series.push(am5xy.XYSeries.new(root, {
        name: "Male",
        xAxis: xAxis,
        yAxis: yAxis,
        valueXField: "age",
        valueYField: "categoryJitter",
        categoryYField: "category",
        tooltip: am5.Tooltip.new(root, {
            labelText: "{name} ({gender})\nAge: {age}, Year: {year}\n{category}\n{motivation}"
        })
    }));
    
    // Create female series
    const femaleSeries = chart.series.push(am5xy.XYSeries.new(root, {
        name: "Female",
        xAxis: xAxis,
        yAxis: yAxis,
        valueXField: "age",
        valueYField: "categoryJitter",
        categoryYField: "category",
        tooltip: am5.Tooltip.new(root, {
            labelText: "{name} ({gender})\nAge: {age}, Year: {year}\n{category}\n{motivation}"
        })
    }));
    
    // Configure male bullets
    maleSeries.bullets.push(function () {
        const bulletCircle = am5.Circle.new(root, {
            radius: 4,
            fill: am5.color("#2E86AB"),
            stroke: am5.color("#ffffff"),
            strokeWidth: 1,
            fillOpacity: 0.8
        });
        
        bulletCircle.states.create("hover", {
            radius: 6,
            fillOpacity: 1
        });
        
        return am5.Bullet.new(root, {
            sprite: bulletCircle
        });
    });
    
    // Configure female bullets
    femaleSeries.bullets.push(function () {
        const bulletCircle = am5.Circle.new(root, {
            radius: 4,
            fill: am5.color("#E91E63"),
            stroke: am5.color("#ffffff"),
            strokeWidth: 1,
            fillOpacity: 0.8
        });
        
        bulletCircle.states.create("hover", {
            radius: 6,
            fillOpacity: 1
        });
        
        return am5.Bullet.new(root, {
            sprite: bulletCircle
        });
    });
    
    // Filter and set data
    const maleData = data.filter(d => d.gender === 'male');
    const femaleData = data.filter(d => d.gender === 'female');
    
    maleSeries.data.setAll(maleData);
    femaleSeries.data.setAll(femaleData);
    
    // Add legend
    const legend = chart.children.push(am5.Legend.new(root, {
        centerX: am5.percent(50),
        x: am5.percent(50)
    }));
    
    legend.data.setAll(chart.series.values);
    
    // Add average age line
    const averageAge = data.reduce((sum, d) => sum + d.age, 0) / data.length;
    
    const averageRange = yAxis.createAxisRange(yAxis.makeDataItem({}));
    averageRange.get("grid").setAll({
        stroke: am5.color("#666666"),
        strokeDasharray: [5, 5],
        strokeWidth: 2
    });
    
    // Add average age label
    const averageLabel = chart.plotContainer.children.push(am5.Label.new(root, {
        text: `Average age ${Math.round(averageAge)} years`,
        x: am5.percent(50),
        y: am5.percent(10),
        centerX: am5.percent(50),
        background: am5.RoundedRectangle.new(root, {
            fill: am5.color("#ffffff"),
            fillOpacity: 0.8,
            cornerRadiusTL: 5,
            cornerRadiusTR: 5,
            cornerRadiusBL: 5,
            cornerRadiusBR: 5
        }),
        paddingTop: 5,
        paddingBottom: 5,
        paddingLeft: 10,
        paddingRight: 10
    }));
    
    // Add vertical line for average age
    const averageAgeRange = xAxis.createAxisRange(xAxis.makeDataItem({ value: averageAge }));
    averageAgeRange.get("grid").setAll({
        stroke: am5.color("#666666"),
        strokeDasharray: [5, 5],
        strokeWidth: 2
    });
    
    // Add click events for detailed information
    maleSeries.bullets.template.get("sprite").on("click", function(ev) {
        const dataItem = ev.target.dataItem;
        const winnerData = dataItem.dataContext;
        showWinnerDetailModal(winnerData);
    });
    
    femaleSeries.bullets.template.get("sprite").on("click", function(ev) {
        const dataItem = ev.target.dataItem;
        const winnerData = dataItem.dataContext;
        showWinnerDetailModal(winnerData);
    });
    
    chart.appear(1000, 100);
    
    interactiveGenderChart = root;
    return root;
}

// Show detailed winner information modal
function showWinnerDetailModal(winnerData) {
    const modal = document.getElementById('winner-detail-modal');
    const modalContent = document.getElementById('winner-detail-modal-content');
    
    if (!modal || !modalContent) {
        createWinnerDetailModal();
        return showWinnerDetailModal(winnerData);
    }
    
    let html = `
        <div class="modal-header">
            <h2>${winnerData.name}</h2>
            <span class="close-winner-detail-modal">&times;</span>
        </div>
        <div class="modal-body">
            <div class="winner-detail-summary">
                <div class="detail-row">
                    <strong>Category:</strong> ${winnerData.category}
                </div>
                <div class="detail-row">
                    <strong>Year:</strong> ${winnerData.year}
                </div>
                <div class="detail-row">
                    <strong>Age at Award:</strong> ${winnerData.age} years old
                </div>
                <div class="detail-row">
                    <strong>Gender:</strong> ${winnerData.gender.charAt(0).toUpperCase() + winnerData.gender.slice(1)}
                </div>
                ${winnerData.country ? `<div class="detail-row"><strong>Born in:</strong> ${winnerData.country}</div>` : ''}
                ${winnerData.organization ? `<div class="detail-row"><strong>Organization:</strong> ${winnerData.organization}</div>` : ''}
            </div>
            <div class="motivation-section">
                <h3>Achievement</h3>
                <p class="motivation-text">${winnerData.motivation}</p>
            </div>
        </div>
    `;
    
    modalContent.innerHTML = html;
    modal.style.display = 'block';
    
    // Add close event
    const closeBtn = modalContent.querySelector('.close-winner-detail-modal');
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
function createWinnerDetailModal() {
    const modal = document.createElement('div');
    modal.id = 'winner-detail-modal';
    modal.className = 'modal';
    
    const modalContent = document.createElement('div');
    modalContent.id = 'winner-detail-modal-content';
    modalContent.className = 'modal-content';
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}

// Initialize interactive gender chart
async function initInteractiveGenderChart() {
    const data = await loadInteractiveGenderData();
    interactiveGenderData = processInteractiveGenderData(data);
    createInteractiveGenderChart(interactiveGenderData);
}

// Category filter for interactive chart
function updateInteractiveGenderFilter() {
    const selectedCategories = [];
    const checkboxes = document.querySelectorAll('.interactive-gender-filter input[type="checkbox"]:checked');
    
    checkboxes.forEach(checkbox => {
        selectedCategories.push(checkbox.value.toLowerCase());
    });
    
    if (selectedCategories.length === 0) {
        createInteractiveGenderChart(interactiveGenderData);
    } else {
        const filteredData = interactiveGenderData.filter(d => 
            selectedCategories.includes(d.category.toLowerCase())
        );
        createInteractiveGenderChart(filteredData);
    }
}

// Export functions for global access
window.initInteractiveGenderChart = initInteractiveGenderChart;
window.updateInteractiveGenderFilter = updateInteractiveGenderFilter; 