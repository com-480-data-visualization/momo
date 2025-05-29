// --- 国家名称/代码映射 ---
// am5geodata_worldLow 使用 ISO 3166-1 alpha-2 代码作为 ID。
// 我们需要将 CSV 中的名称映射到这些 ID。

// 1. 从 am5geodata_worldLow 创建一个 名字 -> ID 的基础映射 (忽略大小写)
const countryNameToIdMap = {};
if (typeof am5geodata_worldLow !== 'undefined') {
    am5geodata_worldLow.features.forEach(feature => {
        countryNameToIdMap[feature.properties.name.toLowerCase()] = feature.id;
    });
} else {
    console.error("am5geodata_worldLow is not loaded! Map cannot be created.");
}


// 2. 创建一个手动映射，处理常见的不一致情况和我们的 CSV 数据
const manualBornToIdMap = {
    "USA": "US",
    "UK": "GB",
    "United Kingdom": "GB",
    "Scotland": "GB",
    "Northern Ireland": "GB",
    "England": "GB",
    "Russia": "RU",
    "Russian Federation": "RU",
    "the Netherlands": "NL",
    "Netherlands": "NL",
    "Democratic Republic of the Congo": "CD",
    "Dem. Rep. Congo": "CD",
    "Congo": "CD", // 添加更多可能的变体
    "Turkey": "TR",
    "Turkiye": "TR",
    "Czech Republic": "CZ",
    "Czech Rep.": "CZ",
    "East Timor": "TL",
    "Timor-Leste": "TL",
    "Guadeloupe Island": "FR", // 映射到法国
    "Faroe Islands (Denmark)": "DK", // 映射到丹麦
    "Germany": "DE",
    "France": "FR",
    "Japan": "JP",
    "Canada": "CA",
    "Sweden": "SE",
    "Switzerland": "CH",
    "Austria": "AT",
    "Italy": "IT",
    "Poland": "PL",
    "Norway": "NO",
    "Denmark": "DK",
    "Australia": "AU",
    "Belgium": "BE",
    "China": "CN",
    "India": "IN",
    "Spain": "ES",
    "Ireland": "IE",
    "Hungary": "HU",
    "Argentina": "AR",
    "South Africa": "ZA",
    "Egypt": "EG",
    "Israel": "IL"
};

// 3. 最终的获取 ID 函数
const getCountryId = (bornCountry) => {
    if (!bornCountry) return null;
    // 优先使用手动映射 (处理 USA 等)
    let id = manualBornToIdMap[bornCountry];
    if (id) return id;
    // 其次尝试手动映射的小写版本 (以防万一)
    id = manualBornToIdMap[bornCountry.toLowerCase()];
     if (id) return id;
    // 最后尝试 am5geodata 名称的小写匹配
    id = countryNameToIdMap[bornCountry.toLowerCase()];
    return id || null; // 如果都找不到，返回 null
};


// --- amCharts 初始化 ---
am5.ready(function () {
    console.log("am5.ready: Starting World Map setup.");

    // 全局变量存储数据和状态
    let nobelData = [];
    window.selectedMapYear = parseInt(document.getElementById("timeline-slider").value, 10);
    window.selectedMapCategory = "all";

    // 创建 Root 元素
    let root = am5.Root.new("chartdiv");
    root.setThemes([am5themes_Animated.new(root)]);

    // 创建 MapChart
    let chart = root.container.children.push(am5map.MapChart.new(root, {
        panX: "translateX",
        panY: "translateY",
        projection: am5map.geoMercator(),
        homeZoomLevel: 1.2, // 稍微放大一点
        homeGeoPoint: { latitude: 30, longitude: 10 } // 调整中心点
    }));

    // 创建 PolygonSeries (国家多边形)
    let polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
        geoJSON: am5geodata_worldLow,
        valueField: "value", // 数据中的值字段
        exclude: ["AQ"] // 排除南极洲
    }));

    // 设置多边形模板
    polygonSeries.mapPolygons.template.setAll({
        tooltipText: "{name}: {value} winner(s)", // Tooltip 显示国家和值
        toggleKey: "active",
        interactive: true,
        fill: am5.color(0xCCCCCC) // 默认填充色 (灰色)
    });

    // 鼠标悬停状态
    polygonSeries.mapPolygons.template.states.create("hover", {
        fill: root.interfaceColors.get("primaryButtonHover") // 悬停颜色
    });

    // 选中状态
    polygonSeries.mapPolygons.template.states.create("active", {
        fill: root.interfaceColors.get("primaryButton") // 选中颜色
    });

    // --- 使用 Adapter 实现分级设色 ---
    polygonSeries.mapPolygons.template.adapters.add("fill", function (fill, target) {
        const dataItem = target.dataItem;
        // 只有当 dataItem 和 value 存在时才应用颜色规则
        if (dataItem && dataItem.get("value") !== undefined) {
            const value = dataItem.get("value", 0);

            if (value > 200) return am5.color(0x084594); // > 200
            if (value > 100) return am5.color(0x2171B5); // 101 - 200
            if (value > 50) return am5.color(0x4292C6);  // 51 - 100
            if (value > 20) return am5.color(0x6BAED6);  // 21 - 50
            if (value > 5) return am5.color(0x9ECAE1);   // 6 - 20
            if (value > 0) return am5.color(0xC6DBEF);   // 1 - 5
        }
        // 对于 value 为 0 或没有数据的国家，返回默认的灰色
        return am5.color(0xCCCCCC);
    });

    // --- 点击事件 ---
    let previousPolygon; // Keep this variable
    polygonSeries.mapPolygons.template.events.on("click", function (ev) {
        const target = ev.target; // The clicked MapPolygon
        const dataContext = target.dataItem.dataContext; // Data of the clicked country
        const countryName = dataContext.name; // amCharts standard name

        let isNowActive; // To determine the message for the toast

        // Your existing logic for handling selection and zoom
        if (previousPolygon && previousPolygon !== target) {
            previousPolygon.set("active", false);
        }

        if (target.get("active")) { // If it was active, this click deactivates it
            target.set("active", false);
            chart.goHome();
            window.setSelectedCountry("All");
            previousPolygon = undefined;
            isNowActive = false;
        } else { // If it was not active, this click activates it
            target.set("active", true);
            polygonSeries.zoomToDataItem(target.dataItem);
            window.setSelectedCountry(countryName);
            previousPolygon = target;
            isNowActive = true;
        }

        // --- Dynamic Notification Logic (Appended to Body) ---

        // Remove any existing toast from the document body immediately
        let existingToast = document.body.querySelector('.click-toast-notification');
        if (existingToast) {
            existingToast.remove();
        }
        // Clear any pending timeouts for hiding/removing previous toasts
        if (window.currentToastTimeout) clearTimeout(window.currentToastTimeout);
        if (window.currentToastRemovalTimeout) clearTimeout(window.currentToastRemovalTimeout);

        const toast = document.createElement('div');
        toast.className = 'click-toast-notification';

        let message = "";
        if (isNowActive) {
            message = `Stats for ${countryName} loaded below.`;
        } else {
            message = "Global statistics now showing.";
        }
        toast.textContent = message;

        // Append to the document body
        document.body.appendChild(toast);

        // Position the toast using page coordinates from the original browser event
        // ev.originalEvent is the native PointerEvent
        if (ev.originalEvent) {
            toast.style.left = `${ev.originalEvent.pageX}px`;
            toast.style.top = `${ev.originalEvent.pageY}px`;
        } else {
            // Fallback if originalEvent is not available (should be rare for clicks)
            // This part is a safety net; ev.point is relative to the target sprite, less ideal for body append
            console.warn("originalEvent not available for toast positioning. Toast may be misplaced.");
            // You might need a more complex fallback if this occurs often.
            // For now, we'll try to position it at a default location or not show it.
            toast.style.left = '50vw'; // Centered viewport
            toast.style.top = '20vh';  // From top of viewport
            toast.style.transform = 'translate(-50%, -50%)'; // Adjust transform for viewport centering
        }


        // Trigger fade-in and animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Set timeout to fade out
        window.currentToastTimeout = setTimeout(() => {
            toast.classList.remove('show');
            // Remove the element from DOM after fade-out transition
            window.currentToastRemovalTimeout = setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300); // Match CSS transition duration (0.3s)
        }, 2500); // Display duration: toast visible for 2.5 seconds
    });


    // 点击背景（水域）取消选择并回家
    chart.chartContainer.get("background").events.on("click", function () {
        chart.goHome();
        window.setSelectedCountry("All");
        if (previousPolygon) {
            previousPolygon.set("active", false);
            previousPolygon = undefined;
        }
    });

    // 缩放控件
    chart.set("zoomControl", am5map.ZoomControl.new(root, {})).homeButton.set("visible", true);

    // --- 更新地图数据的函数 ---
    window.updateMap = function () {
        console.log(`Updating map. Year: ${window.selectedMapYear}, Cat: ${window.selectedMapCategory}`);

        const filtered = nobelData.filter(d =>
            (parseInt(d.year, 10) <= window.selectedMapYear) &&
            (window.selectedMapCategory === "all" || (d.category && d.category.toLowerCase() === window.selectedMapCategory)) &&
            d.bornCountry
        );

        const grouped = {};
        filtered.forEach(d => {
            grouped[d.bornCountry] = (grouped[d.bornCountry] || 0) + 1;
        });

        const mapData = [];
        let notFound = new Set();
        for (const countryName in grouped) {
            const id = getCountryId(countryName);
            if (id) {
                mapData.push({
                    id: id,
                    value: grouped[countryName]
                });
            } else {
                notFound.add(countryName); // 跟踪未找到的国家
            }
        }
        if (notFound.size > 0) console.warn("Could not map countries:", [...notFound]);

        console.log("Setting Map Data (count:", mapData.length, ")");
        polygonSeries.data.setAll(mapData);
    };

    // --- UI 事件监听器 ---
    const slider = document.getElementById("timeline-slider");
    const yearDisplay = document.getElementById("current-year");
    if (slider && yearDisplay) {
        slider.addEventListener("input", () => { yearDisplay.textContent = slider.value; });
        slider.addEventListener("change", () => {
            window.selectedMapYear = parseInt(slider.value, 10);
            window.updateMap();
        });
    }

 const categoryFilterDiv = document.querySelector(".category-filter"); // 获取父容器
        const dropdownToggle = document.querySelector(".category-filter .dropdown-toggle");
        const dropdownMenu = document.querySelector(".category-filter .dropdown-menu");

        if (categoryFilterDiv && dropdownToggle && dropdownMenu) {

            // 点击按钮时切换显示/隐藏
            dropdownToggle.addEventListener('click', (e) => {
                e.stopPropagation(); // **阻止事件冒泡，非常重要！**
                dropdownMenu.classList.toggle('show'); // 切换 'show' 类
            });

            // 点击菜单项时
            dropdownMenu.addEventListener("click", (e) => {
                if (e.target.classList.contains("dropdown-item")) {
                    e.stopPropagation(); // 阻止冒泡
                    window.selectedMapCategory = e.target.getAttribute("data-category");
                    dropdownToggle.textContent = e.target.textContent; // 更新按钮文本
                    window.updateMap(); // 更新地图

                    // **更新其他图表**
                    if (window.updateBarChart) window.updateBarChart();
                    if (window.updatePieChart) window.updatePieChart();
                    if (window.updateGenderPieChart) window.updateGenderPieChart();
                    if (window.updateAwardAgeHistogramChart) window.updateAwardAgeHistogramChart();

                    dropdownMenu.classList.remove('show'); // 点击后隐藏菜单
                }
            });

            // **点击页面任何其他地方，隐藏菜单**
            window.addEventListener('click', function(event) {
                // 检查点击的是否在 dropdown 内部
                if (!categoryFilterDiv.contains(event.target)) {
                    // 如果菜单是打开的，则关闭它
                    if (dropdownMenu.classList.contains('show')) {
                        dropdownMenu.classList.remove('show');
                    }
                }
            });

        } else {
            console.warn("Category filter elements not found. Dropdown will not work.");
        }


    

    // --- 加载数据并进行初始渲染 ---
    console.log("Attempting to load data...");
    if (typeof Papa !== 'undefined') {
        // Dynamic path that works both locally and on GitHub Pages
        const dataPath = window.location.pathname.includes('/momo/') 
            ? '/momo/nobel_laureates_data.csv' 
            : '../nobel_laureates_data.csv';
        fetch(dataPath) // **确保路径正确!**
            .then(response => {
                if (!response.ok) throw new Error(`Workspace failed: ${response.statusText}`);
                return response.text();
            })
            .then(csvText => {
                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: function(results) {
                        if (results.errors.length > 0) {
                            console.error("PapaParse Errors:", results.errors);
                            throw new Error("CSV Parsing failed.");
                        }
                        nobelData = results.data;
                        console.log("Data loaded (", nobelData.length, "rows). Performing initial map update.");
                        window.updateMap(); // **用加载的数据进行首次渲染**
                    }
                });
            })
            .catch(error => {
                console.error('Error loading or parsing Nobel data:', error);
                document.getElementById("chartdiv").innerHTML = `Error loading data. ${error.message}`;
            });
    } else {
        console.error("PapaParse library not found!");
        document.getElementById("chartdiv").innerHTML = "Error: CSV Parsing library not loaded.";
    }

    // 地图淡入效果
    chart.appear(1000, 100);
    console.log("am5.ready: World Map setup complete.");
});