## Milestone 2 (18 April – 17:00)

**10 % of the final grade**

We concentrate the whole experience around an interactive world map, leveraging many of the techniques introduced in **Lecture 8 – Maps** and **Lecture 11 - Tabular data**.

**Core idea** – Use a single map‑centric view to reveal how Nobel laureates move around the globe, and let users slice the data by year and category via lightweight control panels. In short, we aim to provide an intuitive understanding of past Nobel Prize winners through a user-friendly interactive experience, exploring the data from temporal, geographical, and categorical perspectives.

## 1. Main Visual modules (M→F: must‑have → future)

| ID     | Module                      | Purpose                                                      | Status            |
| ------ | --------------------------- | ------------------------------------------------------------ | ----------------- |
| **M1** | **Choropleth world map**    | Show *where* laureates are born / affiliated per year.       | Prototype ready ✔️ |
| **M2** | **Year slider**             | Animate evolution 1901‑2023; scrub or autoplay.              | Ready ✔️           |
| **M3** | **Category toggle**         | Facet the map by Physics⇄Peace⇄… or “All”.                   | Ready ✔️           |
| F1     | Migration flow arcs         | Draw birth‑→‑award country arcs for the selected year / laureate. | In progress       |
| F2     | Proportional‐symbol overlay | Map color intensity reflects the number of laureates, toggleable via legend. | In progress       |
|        |                             |                                                              |                   |
|        |                             |                                                              |                   |

**Interaction logic**

- *Hover* → tooltip with laureate info.
- *Click* country → locks selection, activates side‑cars.
- *Shift‑Click* second country → shows bilateral flow comparison.
- Legend acts as a *mutually exclusive* category filter.

<img src="/Users/stevechu/Desktop/Coursework/momo/assets/image-20250418154413323.png" alt="image-20250418154413323" style="zoom: 50%;" />

------

## 2. Auxiliary Visual modules

While the map holds centre stage, two compact panels provide detail‑on‑demand and shows the number of Nobel laureates per year. Users can filter the data by:

- **Type** (award category)
- **Country**.
   It supports interactive exploration of how Nobel awards fluctuate over time, either globally or for a specific country or category.

| Module Name               | Chart Type | Key User Question Addressed                           |      | Status |
| ------------------------- | ---------- | ----------------------------------------------------- | ---- | ------ |
| **Winners Over Time**     | Bar chart  | How does the number of winners change over time?      |      | Ready✔️ |
| **Category Distribution** | Pie chart  | Which fields dominate a given country's Nobel record? |      | Ready✔️ |

<img src="/Users/stevechu/Desktop/Coursework/momo/assets/image-20250418154533120.png" alt="image-20250418154533120" style="zoom:50%;" />

------

## 3. General Statistics & Comparative View

Beyond map‑centred exploration, we provide a **global dashboard** that merges all laureates into aggregated views, allowing quick comparison across time, categories and migration status.

For instance, a birth‑to‑residence plot shows the migration flows of Nobel laureates. Each vertical bar lists the top birth countries on the left and the corresponding residence countries on the right; ribbons are coloured by world region. 

<img src="/Users/stevechu/Desktop/Coursework/momo/docs/assets/m2_transition.jpg" alt="m2_transition" style="zoom:50%;" />

------

## 4. Technical stack summary

- AmCharts 5（Map、Flow、XY/Percent）
-  Vanilla JS + ES Modules
- Build & deploy：Vite → GitHub Pages (CI)