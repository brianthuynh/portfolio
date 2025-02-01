import { fetchJSON, renderProjects, fetchGithubData} from 'portfolio/global.js';

const projects = await fetchJSON('portfolio/lib/projects.json');
const latestProjects = projects.slice(0, 3);
const projectContainer = document.querySelector('.projects');
renderProjects(latestProjects, projectContainer, 'h2');

const githubData = await fetchGithubData('brianthuynh');
const profileStats = document.querySelector('#profile-stats');
if (profileStats) {
    profileStats.innerHTML = `
        <h2>Github Stats</h2>
          <dl>
            <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
            <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
            <dt>Followers:</dt><dd>${githubData.followers}</dd>
            <dt>Following:</dt><dd>${githubData.following}</dd>
          </dl>
      `;
  }