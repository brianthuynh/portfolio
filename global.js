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


console.log('Finished Running')