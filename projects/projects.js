import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');

renderProjects(projects, projectsContainer, 'h2');

// Count the projects so the title stays in sync with the data
const projectsTitle = document.querySelector('.projects-title');
const count = projects?.length ?? 0;
projectsTitle.textContent = `${count} ${count === 1 ? 'Project' : 'Projects'}`;

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let colors = d3.scaleOrdinal(d3.schemeTableau10);
let selectedIndex = -1;
let pieData = []; // year/count data currently drawn in the pie chart

// Keep only the projects from the selected year (all of them if no wedge is selected)
function filterBySelectedYear(projectsGiven) {
  if (selectedIndex === -1) {
    return projectsGiven;
  }
  let selectedYear = pieData[selectedIndex].label;
  return projectsGiven.filter((project) => project.year === selectedYear);
}

// Draw the pie chart and legend of projects per year
function renderPieChart(projectsGiven) {
  // re-calculate rolled data
  let newRolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );
  // re-calculate data
  let newData = newRolledData.map(([year, count]) => {
    return { value: count, label: year };
  });
  // wedge indices change with the data, so find the selected year's new index
  let selectedYear = pieData[selectedIndex]?.label;
  pieData = newData;
  selectedIndex = pieData.findIndex((d) => d.label === selectedYear);
  // re-calculate slice generator, arc data, arcs
  let newSliceGenerator = d3.pie().value((d) => d.value);
  let newArcData = newSliceGenerator(newData);
  let newArcs = newArcData.map((d) => arcGenerator(d));

  // clear old paths and legend items before re-rendering
  let svg = d3.select('svg');
  svg.selectAll('path').remove();
  let legend = d3.select('.legend');
  legend.selectAll('li').remove();

  function highlightSelection() {
    svg
      .selectAll('path')
      .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));
    legend
      .selectAll('li')
      .attr('class', (_, idx) =>
        idx === selectedIndex ? 'legend-item selected' : 'legend-item',
      );
  }

  // Select the clicked wedge, or deselect it if it was already selected
  function toggleSelection(i) {
    selectedIndex = selectedIndex === i ? -1 : i;
    highlightSelection();
    // projectsGiven already matches the search, so both filters apply
    renderProjects(
      filterBySelectedYear(projectsGiven),
      projectsContainer,
      'h2',
    );
  }

  newArcs.forEach((arc, i) => {
    svg
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(i))
      .on('click', () => toggleSelection(i));
  });

  newData.forEach((d, idx) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(idx)}`)
      .attr('class', 'legend-item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => toggleSelection(idx));
  });

  highlightSelection();
}

renderPieChart(projects);

let query = '';

// Update the query and return the projects that match it
function setQuery(newQuery) {
  query = newQuery;
  return projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
}

let searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('change', (event) => {
  let filteredProjects = setQuery(event.target.value);
  // re-render the pie chart first so selectedIndex matches the new wedges
  renderPieChart(filteredProjects);
  // keep the selected year's filter on top of the search
  renderProjects(
    filterBySelectedYear(filteredProjects),
    projectsContainer,
    'h2',
  );
});
