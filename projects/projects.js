import { fetchJSON, renderProjects } from "../global.js";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

const projects = await(fetchJSON('../lib/projects.json'));
const projectContainer = document.querySelector('.projects');
renderProjects(projects, projectContainer, 'h2');

let colors = d3.scaleOrdinal(d3.schemeTableau10);
let newArcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let selectedIndex = -1;
//Refactor all plotting into one function
function renderPieChart(projectsGiven){
    // recalculate rolled data 
    let newRolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year,
    );
    // recalculate data
    let newData = newRolledData.map(([year, count]) => {
        return {value: count , label:year};
    });

    // re-calculate slice generator, arc data, and arc, and etc.
    let newSliceGenerator = d3.pie().value((d) => d.value);
    let newArcData = newSliceGenerator(newData);
    let newArcs = newArcData.map((d) => d.value);
    
    let newSVG = d3.select('svg');
    // TODO: Clear up paths and legends
    
    d3.select('.legend').selectAll('li').remove();
    newSVG.selectAll('path').remove();
    /* Part 5 */
    newArcs.forEach((arc, i) => {
        newSVG
            .append('path')
            .attr('d', arc)
            .attr('fill', colors(i))  // Apply color; ensure 'colors' is correctly defined
            .on('click', () => {
                selectedIndex = selectedIndex === i ? -1 : i; // Toggle selection
                console.log('Clicked')
                newSVG
                    .selectAll('path')
                   .attr('class', (_, idx) => (
                       selectedIndex === idx ? 'selected' : ''
                   ));

                legend
                    .selectAll('li')
                   .attr('class', (_, idx) => (
                          selectedIndex === idx ? 'selected' : ''
                ));
                if (selectedIndex === -1) {
                    renderProjects(projects, 'projectsContainer', 'h2'); // Reset to all projects
                } else {
                    let filteredProjects = projectsGiven.filter(project => project.year.toString() === newData[i].label);
                    renderProjects(filteredProjects, 'projectsContainer', 'h2');
            }   
        }); 
    });
    // update paths and legends
    newArcData.forEach((arc, idx) => {
        d3.select('svg')
          .append('path')
          .attr('d', newArcGenerator(arc))
          .attr('fill', colors(idx));
    })
    let legend = d3.select('.legend');
    newData.forEach((d, idx) => {
    legend.append('li')
            .attr('style', `--color:${colors(idx)}`) // set the style attribute while passing in parameters
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
    })
};

// Call this function on page load: 
renderPieChart(projects);

let query = '';
let searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('input', (event) => {
    query = event.target.value;
    // Filter the projects
    let filteredProjects = projects.filter((project) => {
        let values = Object.values(project).join('\n').toLowerCase();
        return values.includes(query.toLowerCase());
      });
    // Render updated projects
    renderProjects(filteredProjects, projectContainer, 'h2');
    renderPieChart(filteredProjects);
});






