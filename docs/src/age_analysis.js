// Age Analysis Visualization for Nobel Prize Winners
let ageRoot;          // amCharts 根
let ageChart;         // XYChart
let xAxis;            // X 轴，用来更新平均线
let maleSeries;       // 男性 series
let femaleSeries;     // 女性 series
let avgLabel;         // 平均年龄标签
let avgRange;         // 平均年龄竖线
let ageData = {};          // {physics:[…], …, all:[…]}

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

// Load and process data for age analysis
async function loadAgeData() {
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

// Process data for age scatter plot
function processAgeData(data) {
    const categories = ['physics', 'chemistry', 'medicine', 'literature', 'peace', 'economics'];
    const processedData = {};
    
    // Initialize categories
    categories.forEach(category => {
        processedData[category] = [];
    });
    
    data.forEach((row, index) => {
        const category = row.category ? row.category.toLowerCase() : '';
        const gender = row.gender ? row.gender.toLowerCase() : '';
        const age = calculateAge(row.born, parseInt(row.year));
        
        if (age && age >= 20 && age <= 100) {
            const obj = {
                id: index,
                name: row.fullName,
                category: category,
                categoryName: category.charAt(0).toUpperCase() + category.slice(1),
                gender: gender,
                age: age,
                year: parseInt(row.year),
                motivation: row.motivation,
                organization: row.organizationName,
                country: row.bornCountry,
                // Add random Y position for scatter effect with better distribution
                yPosition: 0.45 + (Math.random() - 0.5) * 0.2
            };
            processedData[category].push(obj);
        }
    });
    
    return processedData;
}

// Create age scatter plot for specific category
function createAgeChart(firstCategoryData) {
    // 若第一次调用：创建 root / chart / axes / series
    ageRoot = am5.Root.new("agechartdiv");
    
    // Set themes
    ageRoot.setThemes([
        am5themes_Animated.new(ageRoot)
    ]);
    
    // Create chart
    ageChart = ageRoot.container.children.push(am5xy.XYChart.new(ageRoot, {
        panX: true,
        panY: false,
        wheelX: "panX",
        wheelY: "zoomX",
        pinchZoomX: true,
        layout: ageRoot.verticalLayout
    }));
    
    // Add cursor
    const cursor = ageChart.set("cursor", am5xy.XYCursor.new(ageRoot, {}));
    cursor.lineY.set("visible", false);
    
    // Create axes
    xAxis = ageChart.xAxes.push(am5xy.ValueAxis.new(ageRoot, {
        min: 20,
        max: 100,
        renderer: am5xy.AxisRendererX.new(ageRoot, {
            minGridDistance: 50
        }),
        tooltip: am5.Tooltip.new(ageRoot, {})
    }));
    
    xAxis.set("title", am5.Label.new(ageRoot, {
        text: "Age at Award",
        fontWeight: "bold",
        fontSize: 14
    }));
    
    // Create Y axis but make it completely invisible
    const yAxis = ageChart.yAxes.push(am5xy.ValueAxis.new(ageRoot, {
        min: 0,
        max: 1,
        renderer: am5xy.AxisRendererY.new(ageRoot, {
            visible: false,
            minGridDistance: 1000,
            inside: true
        })
    }));
    
    // Hide Y axis completely
    yAxis.get("renderer").set("visible", false);
    yAxis.set("visible", false);
    
    // Gender colors
    const genderColors = {
        male: am5.color("#2E86AB"),
        female: am5.color("#E91E63")
    };
    
    // Create series for male and female
    maleSeries = ageChart.series.push(am5xy.XYSeries.new(ageRoot, {
        name: "Male",
        xAxis: xAxis,
        yAxis: yAxis,
        valueXField: "age",
        valueYField: "yPosition",
        tooltip: am5.Tooltip.new(ageRoot, {
            labelText: "{name}\nAge: {age}, Year: {year}\nCategory: {categoryName}\n{motivation}"
        })
    }));
    
    femaleSeries = ageChart.series.push(am5xy.XYSeries.new(ageRoot, {
        name: "Female",
        xAxis: xAxis,
        yAxis: yAxis,
        valueXField: "age",
        valueYField: "yPosition",
        tooltip: am5.Tooltip.new(ageRoot, {
            labelText: "{name}\nAge: {age}, Year: {year}\nCategory: {categoryName}\n{motivation}"
        })
    }));
    
    // Configure male bullets
    maleSeries.bullets.push(function () {
        const bulletCircle = am5.Circle.new(ageRoot, {
            radius: 6,
            fill: genderColors.male,
            stroke: am5.color("#ffffff"),
            strokeWidth: 1,
            fillOpacity: 0.8,
            cursorOverStyle: "pointer"
        });
        
        bulletCircle.states.create("hover", {
            radius: 8,
            fillOpacity: 1
        });
        
        return am5.Bullet.new(ageRoot, {
            sprite: bulletCircle
        });
    });
    
    // Configure female bullets
    femaleSeries.bullets.push(function () {
        const bulletCircle = am5.Circle.new(ageRoot, {
            radius: 6,
            fill: genderColors.female,
            stroke: am5.color("#ffffff"),
            strokeWidth: 1,
            fillOpacity: 0.8,
            cursorOverStyle: "pointer"
        });
        
        bulletCircle.states.create("hover", {
            radius: 8,
            fillOpacity: 1
        });
        
        return am5.Bullet.new(ageRoot, {
            sprite: bulletCircle
        });
    });
    
    // Filter and set data by gender
    const maleData = firstCategoryData.filter(d => d.gender === 'male');
    const femaleData = firstCategoryData.filter(d => d.gender === 'female');
    
    maleSeries.data.setAll(maleData);
    femaleSeries.data.setAll(femaleData);
    
    // Calculate and display average age
    if (firstCategoryData.length > 0) {
        const averageAge = firstCategoryData.reduce((sum, d) => sum + d.age, 0) / firstCategoryData.length;
        
        // Add vertical line for average age
        avgRange = xAxis.createAxisRange(xAxis.makeDataItem({ value: averageAge }));
        avgRange.get("grid").setAll({
            stroke: am5.color("#FF5722"),
            strokeDasharray: [6, 6],
            strokeWidth: 4
        });
        
        // Add average age label
        avgLabel = ageChart.plotContainer.children.push(am5.Label.new(ageRoot, {
            text: `Average age ${Math.round(averageAge)} years`,
            x: am5.percent(50),
            y: am5.percent(10),
            centerX: am5.percent(50),
            background: am5.RoundedRectangle.new(ageRoot, {
                fill: am5.color("#ffffff"),
                fillOpacity: 0.9,
                cornerRadiusTL: 5,
                cornerRadiusTR: 5,
                cornerRadiusBL: 5,
                cornerRadiusBR: 5,
                stroke: am5.color("#cccccc"),
                strokeWidth: 1
            }),
            paddingTop: 8,
            paddingBottom: 8,
            paddingLeft: 12,
            paddingRight: 12,
            fontSize: 14,
            fontWeight: "bold"
        }));
    }
    
    // Add fixed legend (always show Male/Female regardless of data)
    const legend = ageChart.children.push(am5.Legend.new(ageRoot, {
        centerX: am5.percent(50),
        x: am5.percent(50)
    }));
    
    // Create fixed legend data that doesn't change
    const legendData = [
        {
            name: "Male",
            fill: genderColors.male
        },
        {
            name: "Female", 
            fill: genderColors.female
        }
    ];
    
    legend.data.setAll([
        { name:"Male", fill:am5.color("#2E86AB") },
        { name:"Female", fill:am5.color("#E91E63") }
    ]);
    
    ageChart.appear(1000, 100);
    
    // Store the root reference for proper disposal later
    ageChart = ageRoot;
    return ageRoot;
}

// Show detailed winner information modal
function showAgeDetailModal(winnerData) {
    const modal = document.getElementById('age-detail-modal');
    const modalContent = document.getElementById('age-detail-modal-content');
    
    if (!modal || !modalContent) {
        createAgeDetailModal();
        return showAgeDetailModal(winnerData);
    }
    
    let html = `
        <div class="modal-header">
            <h2>${winnerData.name}</h2>
            <span class="close-age-detail-modal">&times;</span>
        </div>
        <div class="modal-body">
            <div class="winner-detail-summary">
                <div class="detail-row">
                    <strong>Category:</strong> ${winnerData.categoryName}
                </div>
                <div class="detail-row">
                    <strong>Year:</strong> ${winnerData.year}
                </div>
                <div class="detail-row">
                    <strong>Age at Award:</strong> ${winnerData.age} years old
                </div>
                <div class="detail-row">
                    <strong>Gender:</strong> ${winnerData.gender ? winnerData.gender.charAt(0).toUpperCase() + winnerData.gender.slice(1) : 'Unknown'}
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
    const closeBtn = modalContent.querySelector('.close-age-detail-modal');
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

// Create modal for age details
function createAgeDetailModal() {
    const modal = document.createElement('div');
    modal.id = 'age-detail-modal';
    modal.className = 'modal';
    
    const modalContent = document.createElement('div');
    modalContent.id = 'age-detail-modal-content';
    modalContent.className = 'modal-content';
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}

// Initialize age chart
async function initAgeChart() {
    console.log('Initializing age chart...');
    const data = await loadAgeData();
    console.log('Loaded data:', data.length, 'rows');
    ageData = processAgeData(data);
    console.log('Processed age data by category:', Object.keys(ageData).map(cat => `${cat}: ${ageData[cat].length}`));
    createAgeChart(ageData['physics']);          // 默认 Physics
}

// Category filter for age chart
function updateAgeFilter() {
    const cat = document.querySelector('input[name="age-category"]:checked').value;
    switchCategory(cat);
}

// Export functions for global access
window.initAgeChart = initAgeChart;
window.updateAgeFilter = updateAgeFilter;

function switchCategory(cat){
    const arr = ageData[cat];
    maleSeries.data.setAll(arr.filter(d=>d.gender==='male'));
    femaleSeries.data.setAll(arr.filter(d=>d.gender==='female'));

    // 重新计算平均线
    const avg = arr.reduce((s,d)=>s+d.age,0)/arr.length;
    // Ensure avgRange exists before trying to remove it or access its properties
    if (avgRange && avgRange.get("value") !== undefined) { // Check avgRange itself first
        xAxis.axisRanges.removeValue(avgRange);
    }
    avgRange = xAxis.createAxisRange(xAxis.makeDataItem({ value:avg }));
    avgLabel.set("text",`Average age ${Math.round(avg)} years`);
} 