let data = [];
let commits = [];

// Define loadData only once with the correct processing inside
async function loadData() {
    data = await d3.csv('loc.csv', (row) => ({
        ...row,
        line: Number(row.line),
        depth: Number(row.depth),
        length: Number(row.length),
        date: new Date(row.date + 'T00:00' + row.timezone),
        datetime: new Date(row.datetime),
    }));
    displayStats();
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    createScatterplot();
});

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
function createScatterplot() {
    const width = 1000;
    const height = 600;
    const margin = { top: 10, right: 10, bottom: 30, left: 20 };
    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
    
    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };

    const svg = d3.select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');

    // Update scales with margins
    xScale = d3.scaleTime()
        .domain(d3.extent(sortedCommits, (d) => d.datetime))
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
    
    // Add dots after setting up axes to avoid them lying outside
    const [minLines, maxLines] = d3.extent(sortedCommits, (d) => d.totalLines);
    const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([5, 25]);
    const dots = svg.append('g').attr('class', 'dots');
    dots.selectAll('circle')
        .data(sortedCommits)
        .join('circle')
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        .attr('r', (d) => rScale(d.totalLines))
        .attr('fill', 'steelblue')
        .on('mouseenter', (event, commit) => {
            updateTooltipContent(commit); // Update the content based on the data point
            updateTooltipVisibility(true); // Show the tooltip
            updateTooltipPosition(event); // Update position to be next to the cursor
        })
        .on('mouseleave', () => {
            updateTooltipContent({});
            updateTooltipVisibility(false); // Hide the tooltip
        });
    
    brushSelector();
    
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
   
}

function isCommitSelected(commit) {
    if (!brushSelection) return false; // If there's no brush selection, return false immediately.
    // Define the minimum and maximum coordinates of the brush selection.
    const min = { x: brushSelection[0][0], y: brushSelection[0][1] };
    const max = { x: brushSelection[1][0], y: brushSelection[1][1] };
    // Scale the commit's date and hour fraction to get their coordinates on the graph.
    const x = xScale(commit.date); // Assuming commit.date holds the date of the commit.
    const y = yScale(commit.hourFrac); // Assuming commit.hourFrac holds the hour fraction of the commit.
    // Return true if the scaled coordinates are within the bounds of the brush selection.
    return x >= min.x && x <= max.x && y >= min.y && y <= max.y;
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
    const selectedCommits = brushSelection
      ? commits.filter(isCommitSelected)
      : [];
  
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
