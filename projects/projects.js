import { fetchJSON, renderProjects } from "../global.js";
const projects = await(fetchJSON('../lib/projects.json'));
const projectContainer = document.querySelector('.projects');
renderProjects(projects, projectContainer, 'h2');