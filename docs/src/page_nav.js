document.addEventListener('DOMContentLoaded', function () {
    const navLinks = document.querySelectorAll('header nav.top-nav ul li a.nav-link');
    const pageSections = document.querySelectorAll('.page-section');
    const defaultPage = 'home';

    // Flags to track chart initialization
    window.analysisChartsInitialized = {
        timeSeries: false,
        ageAnalysis: false,
        flowChart: false
    };

    function showPage(pageId) {
        pageSections.forEach(section => {
            section.style.display = section.id === pageId ? 'block' : 'none';
        });
        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('data-page') === pageId);
        });

        if (pageId === 'analysis') {
            if (typeof initTimeSeriesChart === 'function' && !window.analysisChartsInitialized.timeSeries) {
                initTimeSeriesChart();
                window.analysisChartsInitialized.timeSeries = true;
            }
            if (typeof initAgeChart === 'function' && !window.analysisChartsInitialized.ageAnalysis) {
                initAgeChart();
                window.analysisChartsInitialized.ageAnalysis = true;
            }
            if (typeof initBirthOrgFlowChart === 'function' && !window.analysisChartsInitialized.flowChart) {
                initBirthOrgFlowChart();
                window.analysisChartsInitialized.flowChart = true;
            }
        }
        // Add similar logic for 'home' page charts if they also need explicit re-initialization
        // or if their containers being hidden causes issues.
        // For amCharts5, usually calling chart.appear() or simply making the div visible
        // is enough for them to render. You might need to dispatch a resize event
        // if charts don't fill their containers correctly after being unhidden:
        // window.dispatchEvent(new Event('resize'));
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function (event) {
            event.preventDefault();
            const targetPageId = this.getAttribute('data-page');
            showPage(targetPageId);
        });
    });

    showPage(defaultPage); // Show default page on load

    // Existing filter event listeners from your original #general-statistics section
    const timeseriesCheckboxes = document.querySelectorAll('.timeseries-filter input[type="checkbox"]');
    timeseriesCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            if (typeof updateTimeSeriesFilter === 'function') {
                updateTimeSeriesFilter();
            }
        });
    });

    const ageRadios = document.querySelectorAll('input[name="age-category"]');
    ageRadios.forEach(radio => {
        radio.addEventListener('change', function () {
            if (typeof updateAgeFilter === 'function') {
                updateAgeFilter();
            }
        });
    });
});