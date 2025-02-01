console.log('IT’S ALIVE!');
document.body.insertAdjacentHTML(
    'afterbegin',
    `
    <label class="color-scheme">
        Theme:
        <select class='dark-light'>
            <option value= "light dark">Automatic</option>
            <option value ="dark">Dark</option>
            <option value ="light">Light</option>
        </select>
    </label>`
);

let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'contact/', title: 'Contact'},
    { url: 'resume/', title: 'Resume'},
    { url: 'https://github.com/brianthuynh', title :'GitHub Repo'}
  ];

const ARE_WE_HOME = document.documentElement.classList.contains('home');

let nav = document.createElement('nav');
document.body.prepend(nav);

for(let p of pages) {
    let title = p.title;
    let url = p.url
    url = !ARE_WE_HOME && !url.startsWith('http') ? '../' + url : url
    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;

    a.classList.toggle(
        'current',
        a.host === location.host && a.pathname === location.pathname
    );

        if (a.host !== location.host){
            a.target = "_blank";
        }
    nav.append(a);
}


let select = document.querySelector('.dark-light')
if("colorScheme" in localStorage){
    document.body.className = localStorage.colorScheme;
    select.value = localStorage.colorScheme;
    document.documentElement.style.setProperty('color-scheme', select.value)
};

select.addEventListener('input', function(event) {
    localStorage.colorScheme = event.target.value;
    document.documentElement.style.setProperty('color-scheme', event.target.value)
    console.log('color scheme changed to', event.target.value);
  });

let form = document.querySelector('.mailme')
form?.addEventListener('submit', handleFormSubmit);

function handleFormSubmit(event){
    event.preventDefault();
    const data = new FormData(event.target);
    const params = new URLSearchParams();

    for (let [name, value] of data){
        console.log(name, encodeURIComponent(value))
        params.append(name, value);
    }
    const baseUrl = 'mailto:bth001@ucsd.edu'
    const full_url = `${baseUrl}?${params.toString()}`;

   location.href = full_url;
}

  
function $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
}

export async function fetchJSON(url) {
    try {
        const response = await fetch(url);
        console.log(response);
        // Check if the fetch was successful
        if (!response.ok) {
            throw new Error(`Failed to fetch projects: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching or parsing JSON data:', error);
    }
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
    // update the projects count in the heading with h1 size font
    const projectsCount = document.getElementById('projects-count');
    if (projectsCount) {
        projectsCount.textContent = projects.length;
    };

    // Your code will go here
    containerElement.innerHTML = '';
    // loop through each project in the array of project
    projects.forEach(project => {
        // Create a new <article> element for each project
        const article = document.createElement('article');

        // Set the innerHTML of the article to include the project details
        article.innerHTML = `
            <h3>${project.title}</h3>
            <img src="${project.image}" alt="${project.title}">
            <p>${project.description}</p>
        `;

        // Append the new article to the container element
        containerElement.appendChild(article);
    });
}

export async function fetchGithubData(username){ 
    // return statement here
    return fetchJSON(`https://api.github.com/users/brianthuynh10`);
}


console.log('Finished Running');