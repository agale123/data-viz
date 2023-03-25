let width = 1000;
const MAX_WIDTH = 1000;
const HEIGHT = 120;
const COLUMNS = [0.8, 0.8, 0.9, 1, 1.1, 1.1, 1.1];

/** Use the viridis color palette to color based on seed. */
function colorTeam(seed) {
    seed = parseInt(seed);
    const myColor = d3.scaleSequential().domain([1, 16])
        .interpolator(d3.interpolateViridis);
    return myColor(seed);
}

/**
 * Calculates the radius of a circle where a finish of 1 has a radius of
 * (width/30) and each subsequent finish has half the area.
 */
function calcRadius(finish) {
    // Ensure it is an integer
    finish = parseInt(finish);
    return (width / 30) * (1 - Math.log2(2 * finish) / Math.log2(2 * 2 * 64));
}

function dedupeAndSort(list) {
    const set = new Set(list);
    return [...set.values()].sort((a, b) => a - b);
}

function drawPack(svg, x, y, teams) {
    const container = svg.append("g");
    const root = d3.pack()
        .size([100, 100])
        .padding(3)
        .radius(() => calcRadius(teams[0]["finish"]))
        (d3.hierarchy({ children: teams }).sum(i => calcRadius(i["finish"])));

    container.selectAll("circle")
        .data(root.leaves())
        .join("circle")
        .attr("stroke", "none")
        .attr("fill", d => colorTeam(d["data"]["seed"]))
        .attr("fill-opacity", 1)
        .attr("r", d => d["r"])
        .attr("transform", d => `translate(${x + d.x},${y + d.y})`);

}

function drawYear(teams, year) {
    const subset = teams
        .filter(m => m["year"] === String(year) && m["finish"] !== "68");

    width = Math.min(document.querySelector("#host").clientWidth, MAX_WIDTH);

    // Draw svg
    const svg = d3
        .select("#host")
        .append("svg")
        .attr("width", width)
        .attr("height", HEIGHT);

    // Season title
    svg.append("g").attr("class", "text").append("text")
        .attr("width", HEIGHT)
        .attr("x", 20)
        .attr("y", HEIGHT * 0.5)
        .attr("text-anchor", "middle")
        .attr("transform", `rotate(270,20,${HEIGHT * 0.5})`)
        .text(year);

    // Get finishes
    const finishes = dedupeAndSort(subset.map(m => parseInt(m["finish"])));
    const denom = COLUMNS.reduce((a, b) => a + b, 0);
    let x = 0.3 / denom * width;
    for (let i = 0; i < finishes.length; i++) {
        const finish = finishes[i];
        const finishTeams = subset.filter(m => m["finish"] === `${finish}`);
        drawPack(svg, x, HEIGHT / 2 - 50, finishTeams);

        x = x + COLUMNS[i] / denom * width;
    }
}

async function drawChart() {
    // Get data
    const teams = await d3.csv("data/all_teams.csv");

    const years = dedupeAndSort(teams.map(t => parseInt(t["year"]))).reverse();
    for (const year of years) {
        drawYear(teams, year);
    }
}

drawChart();
