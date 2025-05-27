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
    let previousPolygon;
    polygonSeries.mapPolygons.template.events.on("click", function (ev) {
        const target = ev.target;
        const dataContext = target.dataItem.dataContext;
        const countryName = dataContext.name; // 获取 amCharts 标准名称

        // **重要**：我们需要将 amCharts 名称转换回我们的数据名称或通用名称
        // 以便 chart_controller 能正确处理。这里我们暂时传递 amCharts 名称，
        // 但 chart_controller 可能需要增加映射逻辑。
        // 或者，我们在这里进行反向查找（更复杂）。
        // 暂时先用 amCharts 名称，并在 controller 中处理。
        console.log("Map Clicked:", countryName);
        window.setSelectedCountry(countryName); // 调用控制器

        // 处理地图高亮和缩放
        if (previousPolygon && previousPolygon != target) {
            previousPolygon.set("active", false);
        }
        // 如果点击的是当前已选中的，则取消选中并回家
        if (target.get("active")) {
             target.set("active", false);
             chart.goHome();
             window.setSelectedCountry("All"); // 取消选中时重置筛选
             previousPolygon = undefined;
        } else {
            target.set("active", true);
            polygonSeries.zoomToDataItem(target.dataItem);
            previousPolygon = target;
        }
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
                    dropdownToggle.textContent = e.target.textContent + " ▼"; // 更新按钮文本
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