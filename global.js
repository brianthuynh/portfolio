console.log('IT’S ALIVE!');
document.body.insertAdjacentHTML(
    'afterbegin',
    `
    <label class="color-scheme">
        Theme:
        <select class='dark-light'>
            <option value="Automatic">Automatic</option>
            <option value = "Dark">Dark</option>
            <option value = "Light">Light</option>
        </select>
    </label>`
);

let pages = [
    { url: '', title: 'Home' },
    { url: 'portfolio/projects/', title: 'Projects' },
    { url: 'portfolio/contact/', title: 'Contact'},
    { url: 'portfolio/resume/', title: 'Resume'},
    { url: 'https://github.com/brianthuynh', title :'GitHub Repo'}
];

const ARE_WE_HOME = document.documentElement.classList.contains('home');
let nav = document.createElement('nav');
document.body.prepend(nav);

// Calculate depth based on the pathname
const pathDepth = window.location.pathname.split('/').filter(part => part.length > 0).length;

for (let p of pages) {
    let url = p.url;
    // Adjust the URL based on the depth and whether it's an external link
    if (!ARE_WE_HOME && !url.startsWith('http')) {
        let prefix = '../'.repeat(pathDepth - 1); // Adjust to move up to the root directory
        url = prefix + url;
    }
    let title = p.title;
    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;
    nav.append(a);

    // Highlight the current page link
    if (a.host === location.host && a.pathname === location.pathname) {
        a.classList.add('current');
    }

    // Open external links in a new tab
    if (a.host !== location.host) {
        a.target = "_blank";
    }
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


console.log('Finished Running')