// Sankey Diagram: Birth Country  → Organization Country
// Shows migration / movement of Nobel laureates.
// Only highlight a handful of major countries, everything else is grouped.

// Focus countries to highlight individually (major Nobel prize countries)
const FOCUS_COUNTRIES = [
  "United States",
  "United Kingdom", 
  "Germany",
  "France",
  "Sweden",
  "Japan",
  "Russia",
  "Netherlands",
  "Austria",
  "Norway",
  "Switzerland",
  "Italy",
  "Canada",
  "Australia",
  "Denmark",
  "Belgium",
  "Israel",
  "South Africa"
];

// Very light mapping from country to region for colour purposes
function countryToRegion(country) {
  const america = ["United States", "Canada", "Mexico", "Brazil"];
  const europe  = [
    "United Kingdom", "Germany", "France", "Sweden", "Netherlands", "Austria", "Norway", "Switzerland", "Italy", "Spain", "Russia"
  ];
  const asia    = ["Japan", "China", "India", "Israel", "Turkey", "South Korea"];
  const oceania = ["Australia", "New Zealand"];
  const africa  = ["South Africa", "Egypt", "Kenya"];

  if (america.includes(country)) return "America";
  if (europe.includes(country))  return "Europe";
  if (asia.includes(country))    return "Asia";
  if (oceania.includes(country)) return "Oceania";
  if (africa.includes(country))  return "Africa";
  return "Other";
}

// Region colour palette
const REGION_COLORS = {
  America : am5.color("#e98b39"),  // orange
  Europe  : am5.color("#3f51b5"),  // blue
  Asia    : am5.color("#4fc3f7"),  // cyan
  Oceania : am5.color("#9c27b0"),  // purple
  Africa  : am5.color("#4caf50"),  // green
  Other   : am5.color("#9e9e9e")   // grey
};

// MAIN ENTRY
async function initBirthOrgFlowChart () {
  console.log("Starting initBirthOrgFlowChart");
  
  // 1. Load CSV -------------------------------------------------------------
  const resp = await fetch("../../nobel_laureates_data.csv");
  const csv  = await resp.text();
  const lines   = csv.split(/\n|\r/).filter(l => l.trim().length);
  const headers = lines.shift().split(",");

  const bornIdx = headers.indexOf("bornCountry");
  const orgIdx  = headers.indexOf("organizationCountry");

  const linkMap = new Map();   // key: `${born}|${org}`  → count

  lines.forEach(l => {
    const cols = l.split(",");
    const born = cols[bornIdx] ? cols[bornIdx].trim().replace(/"/g, "") : "";
    const org  = cols[orgIdx]  ? cols[orgIdx].trim().replace(/"/g, "") : "";

    // Clean and normalize country names
    const cleanBorn = born.trim().replace(/"/g, "");
    const cleanOrg = org ? org.trim().replace(/"/g, "") : "";
    
    // Handle common variations
    let normalizedBorn = cleanBorn;
    let normalizedOrg = cleanOrg;
    
    if (cleanOrg === "USA") normalizedOrg = "United States";
    if (cleanBorn === "USA") normalizedBorn = "United States";
    
    const bornGrp = FOCUS_COUNTRIES.includes(normalizedBorn) ? normalizedBorn : "Other Countries";
    let   orgGrp  = "";
    
    if (!normalizedOrg || normalizedOrg === "") {
      orgGrp = "Other Organizations";
    } else if (FOCUS_COUNTRIES.includes(normalizedOrg)) {
      orgGrp = normalizedOrg;
    } else {
      orgGrp = "Other Organizations";
    }

    const key = `${bornGrp}|${orgGrp}`;
    linkMap.set(key, (linkMap.get(key) || 0) + 1);
  });

  // 2. Build link array -----------------------------------------------------
  let links = [];
  linkMap.forEach((value, key) => {
    const [from, to] = key.split("|");
    if (value > 0) {
      links.push({ from, to, value });
    }
  });
  
  console.log("Data prepared, links:", links);
  console.log("Total links:", links.length);
  
  // Show statistics about data distribution
  const orgStats = new Map();
  const birthStats = new Map();
  
  links.forEach(link => {
    orgStats.set(link.to, (orgStats.get(link.to) || 0) + link.value);
    birthStats.set(link.from, (birthStats.get(link.from) || 0) + link.value);
  });
  
  console.log("Top organization countries:");
  [...orgStats.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).forEach(([country, count]) => {
    console.log(`  ${country}: ${count} laureates`);
  });
  
  console.log("Top birth countries:");
  [...birthStats.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).forEach(([country, count]) => {
    console.log(`  ${country}: ${count} laureates`);
  });
  
  // Debug: Check for potential circular reference issues
  const nodes = new Set();
  links.forEach(link => {
    nodes.add(link.from);
    nodes.add(link.to);
  });
  console.log("Unique nodes:", Array.from(nodes));
  
  // Check for and remove problematic links
  console.log("Checking for circular links...");
  
  // Keep significant links (filter out very small flows)
  const MIN_FLOW_SIZE = 3;
  let filteredLinks = links.filter(link => link.value >= MIN_FLOW_SIZE);
  console.log(`Filtered to links with flow >= ${MIN_FLOW_SIZE}:`, filteredLinks.length, "links remaining");
  
  // Create a simplified Sankey structure with two distinct layers
  // Birth countries on the left, organization countries on the right
  const birthCountries = new Set();
  const orgCountries = new Set();
  
  filteredLinks.forEach(link => {
    birthCountries.add(link.from);
    orgCountries.add(link.to);
  });
  
  console.log("Birth countries:", Array.from(birthCountries));
  console.log("Organization countries:", Array.from(orgCountries));
  
  // Create a clean two-layer structure by separating birth and organization countries
  console.log("Creating two-layer structure to eliminate cycles...");
  
  // Create links with display names directly
  const finalLinks = filteredLinks.map(link => {
    return {
      from: `Birth_${link.from}`,      // Use different prefix for display
      to: `Residence_${link.to}`,      // Use different prefix for display  
      value: link.value,
      fromName: link.from,             // Store clean names
      toName: link.to
    };
  });
  
  console.log("Two-layer structure created successfully");
  
  console.log(`Final links count: ${finalLinks.length}`);
  console.log("Final links structure:", finalLinks.slice(0, 5)); // Show first 5 for debugging
  
  // Use final cleaned links
  links = finalLinks;

  // 3. Create amCharts Root & Chart ----------------------------------------
  const root = am5.Root.new("flowchartdiv");
  root.setThemes([ am5themes_Animated.new(root) ]);
  console.log("Root created:", root);

  const chart = root.container.children.push(
    am5flow.Sankey.new(root, {
      sourceIdField  : "from",
      targetIdField  : "to", 
      valueField     : "value",
      orientation    : "horizontal",
      nodeAlign      : "left",
      paddingLeft    : 150,    // More space for left labels
      paddingRight   : 150,    // More space for right labels
      paddingTop     : 20,
      paddingBottom  : 20,
      nodeWidth      : 15,     // Slightly thinner nodes
      nodePadding    : 8       // Less padding between nodes
    })
  );
  console.log("Chart created:", chart);

  // 4. Style links and nodes ---------------------------------------------------
  console.log("Chart links property:", chart.links);
  console.log("Chart nodes property:", chart.nodes);
  
  // Try to style links and nodes with error handling
  try {
    if (chart.links && chart.links.template) {
      chart.links.template.setAll({
        fillOpacity : 0.6,
        tooltipText : "{sourceId} → {targetId}: {value}"
      });
      console.log("Links styled successfully");
    }
  } catch (error) {
    console.log("Failed to style links:", error.message);
  }

  try {
    if (chart.nodes && chart.nodes.template) {
      chart.nodes.template.setAll({
        tooltipText : "{id}: {sum}",
        draggable   : false
      });
      
      // Add label formatter to clean up node names
      chart.nodes.template.get("label").setAll({
        text: "{id}",
        oversizedBehavior: "truncate",
        maxWidth: 120
      });
      
      chart.nodes.template.get("label").adapters.add("text", function(text, target) {
        const node = target.dataItem;
        if (node) {
          const id = node.get("id");
          if (id && id.startsWith("Birth_")) {
            return id.replace("Birth_", "");
          } else if (id && id.startsWith("Residence_")) {
            return id.replace("Residence_", "");
          }
        }
        return text;
      });
      console.log("Nodes styled successfully");
      
      // Try to add color adapter
      chart.nodes.template.adapters.add("fill", (fill, node) => {
        const name = node.get("id");
        
        // Handle the new naming scheme
        if (name.startsWith("Residence_")) {
          const orgName = name.replace("Residence_", "");
          if (orgName === "Other Organizations") {
            return am5.color("#757575"); // Gray for organizations
          }
          const region = countryToRegion(orgName);
          return am5.color.lighten(REGION_COLORS[region] || REGION_COLORS.Other, 0.3);
        } else if (name.startsWith("Birth_")) {
          const birthName = name.replace("Birth_", "");
          const region = countryToRegion(birthName === "Other Countries" ? "" : birthName);
          return REGION_COLORS[region] || REGION_COLORS.Other;
        }
        
        // Fallback
        return REGION_COLORS.Other;
      });
      console.log("Node color adapter added successfully");
    }
  } catch (error) {
    console.log("Failed to style nodes:", error.message);
  }

  // 6. Set data -------------------------------------------------------------
  console.log("Setting chart data with filtered links:", links);
  
  // Try immediate data setting
  try {
    console.log("Attempting to set chart data immediately...");
    console.log("Chart data property exists:", !!chart.data);
    
    if (chart.data && typeof chart.data.setAll === 'function') {
      chart.data.setAll(links);
      console.log("Chart data set successfully!");
      
    } else {
      console.error("chart.data.setAll is not available");
      console.log("Chart properties:", Object.getOwnPropertyNames(chart));
    }
  } catch (error) {
    console.error("Error setting chart data:", error);
    
    // Fallback: Try with setTimeout
    setTimeout(() => {
      try {
        chart.data.setAll(links);
        console.log("Chart data set successfully with setTimeout");
      } catch (e) {
        console.error("setTimeout approach also failed:", e);
      }
    }, 500);
  }

  // 8. Legend ---------------------------------------------------------------
  const legend = root.container.children.push(
    am5.Legend.new(root, {
      centerX : am5.percent(50),
      x       : am5.percent(50),
      y       : 0,
      layout  : root.horizontalLayout
    })
  );
  
  console.log("Legend created:", legend);
  
  // Create legend items manually 
  const legendData = Object.entries(REGION_COLORS).map(([region, color]) => ({
    name: region,
    fill: color
  }));
  
  try {
    legend.data.setAll(legendData);
    console.log("Legend data set successfully");
  } catch (error) {
    console.log("Legend data setting failed:", error.message);
    // Skip legend for now
  }

  chart.appear(1000, 100);
  console.log("Chart appear called");
}

// Expose globally for index.html init
window.initBirthOrgFlowChart = initBirthOrgFlowChart;
