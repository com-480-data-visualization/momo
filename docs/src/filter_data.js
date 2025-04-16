// Timeline Slider
const timelineSlider = document.getElementById('timeline-slider');
const currentYearDisplay = document.getElementById('current-year');

timelineSlider.addEventListener('input', function () {
    const year = this.value;
    currentYearDisplay.textContent = year;
    filterDataByYear(year);
});

// Dropdown Category Filter
const dropdown = document.querySelector('.dropdown');
const dropdownToggle = document.querySelector('.dropdown-toggle');
const dropdownItems = document.querySelectorAll('.dropdown-item');
let selectedCategory = 'all';

// Toggle dropdown visibility
dropdownToggle.addEventListener('click', function () {
    dropdown.classList.toggle('show');
});

// Close dropdown when clicking outside
document.addEventListener('click', function (event) {
    if (!dropdown.contains(event.target)) {
        dropdown.classList.remove('show');
    }
});

// Handle category selection
dropdownItems.forEach(item => {
    item.addEventListener('click', function () {
        selectedCategory = this.dataset.category;
        dropdownToggle.textContent = this.textContent + ' ▼';
        dropdown.classList.remove('show');
        filterDataByCategory(selectedCategory);
    });
});

// Filter functions (implement according to your needs)
function filterDataByYear(year) {
    console.log('Filtering by year:', year);
    // Your implementation
}

function filterDataByCategory(category) {
    console.log('Filtering by category:', category);
    // Your implementation
}
