// Global variables to hold data and filtered commits
let data = [];
let commits = [];
let filteredCommits = [];

// Define loadData only once with the correct processing inside
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    
});

async function loadData() {
    data = await d3.csv('loc.csv', (row) => ({
        ...row,
        line: Number(row.line),
        depth: Number(row.depth),
        length: Number(row.length),
        date: new Date(row.date + 'T00:00' + row.timezone),
        datetime: new Date(row.datetime),
    }));
    processCommits();
    displayStats();
    updateScatterplot(commits);
}

function processCommits() {

    commits = d3.groups(data, (d) => d.commit)
        .map(([commit, lines]) => {
            let first = lines[0];
            let { author, date, time, timezone, datetime } = first;
            let ret = {
                id: commit,
                url: 'https://github.com/portfolio/commit/' + commit,
                author,
                date,
                time,
                timezone,
                datetime,
                hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
                totalLines: lines.length,
            };
            Object.defineProperty(ret, 'lines', {
                value: lines,
                enumerable: false,
                configurable: false,
                writable: false
            });
            return ret;
        });
}


// Update time display and scatterplot based on slider value
function updateTimeDisplay(newCommitSlice) {
    let lines = newCommitSlice.flatMap((d) => d.lines);
    let files = [];
    files = d3
    .groups(lines, (d) => d.file)
    .map(([name, lines]) => {
        return { name, lines };
    });
    files = d3.sort(files, (d) => -d.lines.length);
    d3.select('.files').selectAll('div').remove(); // don't forget to clear everything first so we can re-render
    let filesContainer = d3.select('.files').selectAll('div').data(files).enter().append('div');

    filesContainer.append('dt').append('code').text(d => d.name) // TODO
    filesContainer.append('dd').text(d => d.lines.length) // TODO
    // Assuming filesContainer is your D3 selection where each 'dd' should be appended
    let fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10); // Color scheme to be used
    filesContainer.append('dd')
        .selectAll('div')
        .data(d => d.lines)  // Bind the data array for lines of each file
        .enter()             // Handle new data
        .append('div')       // Append a div for each line
        .attr('class', 'line')  // Set class attribute to 'line'
        .style('background', d => fileTypeColors(d.type)); // Properly use color mapping
    
    
}

// Filter commits by date
function filterCommitsByTime(maxDate) {
    filteredCommits = commits.filter(commit => commit.datetime <= maxDate);
}

function displayStats() {
    // Process commits first
    processCommits();
    // Create the dl element
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');
    // depth
    // avg file lengths
    const fileLengths = d3.rollups(
        data,
        (v) => d3.max(v, (v) => v.line),
        (d) => d.file
      );
    const averageFileLength = d3.mean(fileLengths, (d) => d[1]);

  
    // Add total LOC
    dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd').text(data.length);
  
    // Add total commits
    dl.append('dt').text('Total commits');
    dl.append('dd').text(commits.length);
  
    // Add more stats as needed...
    const files = d3.group(data, d => d.file);
    const numberOfUniqueFiles= files.size;
    dl.append('dt').text('Number of Files');
    dl.append('dd').text(numberOfUniqueFiles);


    dl.append('dt').text('Average File Length');
    dl.append('dd').text(averageFileLength);

    const workByPeriod = d3.rollups(
        data,
        (v) => v.length,
        (d) => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' })
      );
    const maxPeriod = d3.greatest(workByPeriod, (d) => d[1])?.[0];
    dl.append('dt').text('Time when most work is done');
    dl.append('dd').text(maxPeriod);
}
// Step 2: Drawing our graph
let xScale;
let yScale;
let selectedCommits = [];


function updateScatterplot(filteredCommits) {
    // same as before
    const width = 1000;
    const height = 600;
    const margin = { top: 10, right: 10, bottom: 30, left: 20 };
    //const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
    
    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };

    d3.select('svg').remove(); // first clear the svg
    const svg = d3.select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');
  
    xScale = d3.scaleTime()
        .domain(d3.extent(filteredCommits, (d) => d.datetime))
        .range([usableArea.left, usableArea.right])
        .nice();

    yScale = d3.scaleLinear()
        .domain([0, 24])  // Assuming 'hourFrac' ranges from 0 to 24
        .range([usableArea.bottom, usableArea.top]);
    // Add gridlines BEFORE the axes
    const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);

    // Create gridlines as an axis with no labels and full-width ticks
    gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));
    // Create and add the axes before plotting points
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

    // Add X axis
    svg.append('g')
        .attr('transform', `translate(0, ${usableArea.bottom})`)
        .call(xAxis);

    // Add Y axis
    svg.append('g')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .call(yAxis);

  
    const [minLines, maxLines] = d3.extent(filteredCommits, (d) => d.totalLines);
    const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([5, 25]);
    const dots = svg.append('g').attr('class', 'dots');
    dots.selectAll('circle').remove(); 
    dots.selectAll('circle')
        .data(filteredCommits)
        .join('circle')
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        .attr('r', (d) => rScale(d.totalLines))
        .attr('fill', 'steelblue')
        .on('mouseenter', (event, commit) => {
            updateTooltipContent(commit); // Update the content based on the data point
            updateTooltipVisibility(true); // Show the tooltip
            updateTooltipPosition(event); // Update position to be next to the cursor
            d3.select(event.currentTarget).classed('selected', true);
        })
        .on('mouseleave', () => {
            updateTooltipContent({});
            updateTooltipVisibility(false); // Hide the tooltip
            d3.select(event.currentTarget).classed('selected', false);
        });
    
    brushSelector();
  
    // same as before
  }

function updateTooltipContent(commit) {
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');
  
    if (Object.keys(commit).length === 0) return;
  
    link.href = commit.url;
    link.textContent = commit.id;
    date.textContent = commit.datetime?.toLocaleString('en', {
      dateStyle: 'full',
    });
  }

function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.left = `${event.clientX + 10}px`;
    tooltip.style.top = `${event.clientY +10}px`;
  }

let brushSelection = null;

function brushed(event) {
    brushSelection = event.selection;
    updateSelection();
    updateSelectionCount();
    updateLanguageBreakdown();
    selectedCommits = !brushSelection
      ? []
      : commits.filter((commit) => {
          let min = { x: brushSelection[0][0], y: brushSelection[0][1] };
          let max = { x: brushSelection[1][0], y: brushSelection[1][1] };
          let x = xScale(commit.date);
          let y = yScale(commit.hourFrac);
  
          return x >= min.x && x <= max.x && y >= min.y && y <= max.y;
        });
   
}

function isCommitSelected(commit) {
    return selectedCommits.includes(commit);
  }
  
function updateSelection() {
    // Update visual state of dots based on selection
    d3.selectAll('circle').classed('selected', (d) => isCommitSelected(d));
  }

function brushSelector() {
    const svg = document.querySelector('svg');
    d3.select(svg).call(d3.brush());
    // raise dots and everything after the overlay
    d3.select(svg).selectAll('.dots, .overlay ~ *').raise();
    // brushed event
    d3.select(svg).call(d3.brush().on('start brush end', brushed));
}

function updateSelectionCount() {
    
    const countElement = document.getElementById('selection-count');
    countElement.textContent = `${
      selectedCommits.length || 'No'
    } commits selected`;
  
    return selectedCommits;
  }

function updateLanguageBreakdown() {
    const selectedCommits = brushSelection
        ? commits.filter(isCommitSelected)
        : [];
    const container = document.getElementById('language-breakdown');

    if (selectedCommits.length === 0) {
        container.innerHTML = '';
        return;
    }
    const requiredCommits = selectedCommits.length ? selectedCommits : commits;
    const lines = requiredCommits.flatMap((d) => d.lines);

    // Use d3.rollup to count lines per language
    const breakdown = d3.rollup(
        lines,
        (v) => v.length,
        (d) => d.type
    );

    // Update DOM with breakdown
    container.innerHTML = '';

    for (const [language, count] of breakdown) {
        const proportion = count / lines.length;
        const formatted = d3.format('.1~%')(proportion);

        container.innerHTML += `
                <dt>${language}</dt>
                <dd>${count} lines (${formatted})</dd>
            `;
    }
    return breakdown;
}

function renderItems(startIndex) {
  console.log('renderItems called')
    // Clear previous items
    itemsContainer.selectAll('div').remove();
    
    // Determine the range of commits to display
    console.log(commits.length);
    console.log(startIndex + VISIBLE_COUNT);
    const endIndex = Math.min(startIndex + VISIBLE_COUNT, commits.length);
    let newCommitSlice = commits.slice(startIndex, endIndex);
    
    // Update the scatterplot with all commits (or filtered data if needed)
    updateScatterplot(newCommitSlice);
    
    // Re-bind the commit data to the container and represent each using a div
    itemsContainer.selectAll('div')
                  .data(newCommitSlice)
                  .enter()
                  .append('div')
                  .html(d => {
                    // Generating HTML content for each commit
                    const dateTimeStr = d.datetime.toLocaleString("en", {dateStyle: "full", timeStyle: "short"});
                    const commitLink = d.url;
                    const totalLinesEdited = d.totalLines;
                    const filesAffected = d3.rollups(d.lines, lines => lines.length, line => line.file).length;
                    const commitDescription = d.index > 0 ? 'another glorious commit' : 'my first commit, and it was glorious';
                    return `
                      <p>
                        On ${dateTimeStr}, I made
                        <a href="${commitLink}" target="_blank">
                          ${commitDescription}
                        </a>. I edited ${totalLinesEdited} lines across ${filesAffected} files. Then I looked over all I had made, and
                        I saw that it was very good.
                      </p>
                    `;
                  })
                  .style('position', 'absolute')
                  .style('top', (_, idx) => `${idx * ITEM_HEIGHT}px`);
}

function renderDots(startIndex) {
  // Clear previous items
  dotItemsContainer.selectAll('div').remove();
  
  // Determine the range of commits to display
  const endIndex = Math.min(startIndex + VISIBLE_COUNT, commits.length);
  let newCommitSlice = commits.slice(startIndex, endIndex);

  console.log("New Commit Slice Length:", newCommitSlice.length);
  console.log("Start Index:", startIndex);

  
  // ToDo: instead of updating a scatter plot update how many dots that show
  updateTimeDisplay(newCommitSlice);


  // Re-bind the commit data to the container and represent each using a div
  dotItemsContainer.selectAll('div')
                .data(newCommitSlice)
                .enter()
                .append('div')
                .html(d => {
                  // Generating HTML content for each commit
                  const dateTimeStr = d.datetime.toLocaleString("en", {dateStyle: "full", timeStyle: "short"});
                  const commitLink = d.url;
                  const totalLinesEdited = d.totalLines;
                  const filesAffected = d3.rollups(d.lines, lines => lines.length, line => line.file).length;
                  const commitDescription = d.index > 0 ? 'another glorious commit' : 'my first commit, and it was glorious';
                  return `
                    <p>
                      On ${dateTimeStr}, I made
                      <a href="${commitLink}" target="_blank">
                        ${commitDescription}
                      </a>. I edited ${totalLinesEdited} lines across ${filesAffected} files. Then I looked over all I had made, and
                      I saw that it was very good.
                    </p>
                  `;
                })
                .style('position', 'absolute')
                .style('top', (_, idx) => `${idx * ITEM_HEIGHT}px`);
}


let NUM_ITEMS = 30; // Ideally, let this value be the length of your commit history
let ITEM_HEIGHT = 90; // Feel free to change
let VISIBLE_COUNT = 10; // Feel free to change as well
let totalHeight = (NUM_ITEMS - 1) * ITEM_HEIGHT;

const scrollContainer = d3.select('#scroll-container');
const dottyContainer = d3.select('#dotty-container'); // for the second part 

const spacer = d3.select('#spacer');
const dotSpacer = d3.select('#dot-spacer');

spacer.style('height', `${totalHeight}px`);
dotSpacer.style('height', `${totalHeight}px`);


const itemsContainer = d3.select('#items-container');
scrollContainer.on('scroll', () => {
  const scrollTop = scrollContainer.property('scrollTop');
  let startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
  startIndex = Math.max(0, Math.min(startIndex, commits.length - VISIBLE_COUNT));
  renderItems(startIndex);
});


const dotItemsContainer = d3.select('#dotItems-container');
dottyContainer.on('scroll', () => {
    const scrollTop = dottyContainer.property('scrollTop');
    let startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
    startIndex = Math.max(0, Math.min(startIndex, commits.length - VISIBLE_COUNT));
    renderDots(0);
  });

