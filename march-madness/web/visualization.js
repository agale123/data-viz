// Layout constants
let width = 1000;
const MAX_WIDTH = 1000;
const HEIGHT = 120;
const COLUMNS = [0.8, 0.8, 0.9, 1, 1.1, 1.1, 1.1];

// Highlight constants
let seed = undefined;
let team = undefined;

/** Use the viridis color palette to color based on seed. */
function colorTeam(seed) {
    seed = parseInt(seed);
    const myColor = d3.scaleSequential().domain([1, 16])
        .interpolator(d3.interpolateViridis);
    return myColor(seed);
}

/** Determine if the team should be highlighted based on selections. */
function opacityTeam(t) {
    if (seed === undefined && team === undefined) {
        return 1;
    } else if (parseInt(t["seed"]) === seed && team === undefined) {
        return 1;
    } else if (t["team"] === team && seed === undefined) {
        return 1;
    } else if (parseInt(t["seed"]) === seed && t["team"] === team) {
        return 1;
    } else {
        return 0.2;
    }
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

/** Returns a deduplicated and sorted version of a list. */
function dedupeAndSort(list) {
    const set = new Set(list);
    if (typeof set.values().next().value === "string") {
        console.log("string");
        return [...set.values()].sort();
    } else {
        return [...set.values()].sort((a, b) => a - b);
    }
}

function toxy(r, angle) {
    return {
        "x": 50 + r * Math.sin(Math.PI * 2 * angle / 360),
        "y": 50 + r * Math.cos(Math.PI * 2 * angle / 360)
    };
}

function arrangeCircle(teams, circle_r, r) {
    for (let i = 0; i < teams.length; i++) {
        teams[i] = {
            ...teams[i],
            ...toxy(circle_r, 360 * i / teams.length),
            "r": r
        };
    }
    return teams;
}

function getLocations(teams) {
    const radius = calcRadius(teams[0]["finish"]);
    switch (teams.length) {
        case 1:
            return arrangeCircle(teams, 0, radius);
        case 2:
            return arrangeCircle(teams, 20, radius);
        case 4:
            return arrangeCircle(teams, 25, radius);
        case 8:
            const a = radius < 5 ? 0.4 : 1;
            return [
                ...arrangeCircle(teams.slice(0, 1), a * 0, radius),
                ...arrangeCircle(teams.slice(1), a * 30, radius),
            ];
        case 16:
            const b = radius < 5 ? 0.55 : 1;
            return [
                ...arrangeCircle(teams.slice(0, 1), b * 0, radius),
                ...arrangeCircle(teams.slice(1, 6), b * 18, radius),
                ...arrangeCircle(teams.slice(6), b * 35, radius),
            ];
        case 32:
            return [
                ...arrangeCircle(teams.slice(0, 1), 0, radius),
                ...arrangeCircle(teams.slice(1, 7), 12, radius),
                ...arrangeCircle(teams.slice(7, 17), 22, radius),
                ...arrangeCircle(teams.slice(17), 32, radius),
            ];
        default:
            return [];
    }
}

function drawPack(svg, x, y, teams) {
    const container = svg.append("g");
    const root = d3.pack()
        .size([100, 100])
        .padding(3)
        .radius(() => calcRadius(teams[0]["finish"]))
        (d3.hierarchy({ children: teams }).sum(i => calcRadius(i["finish"])));

    const locations = getLocations(teams);

    container.selectAll("circle")
        //.data(root.leaves())
        .data(locations)
        .join("circle")
        .attr("stroke", "none")
        .attr("fill", d => colorTeam(d["seed"]))
        .attr("fill-opacity", d => opacityTeam(d))
        .attr("r", d => d["r"])
        .attr("transform", d => `translate(${x + d["x"]},${y + d["y"]})`);

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

let teams;

async function drawChart() {
    const years = dedupeAndSort(teams.map(t => parseInt(t["year"]))).reverse();
    for (const year of years) {
        drawYear(teams, year);
    }
}

async function initialize() {
    // Get data
    teams = await d3.csv("data/all_teams.csv");

    // Draw everything
    drawChart();

    // Fill in selects
    const seedSelect = document.getElementById("seed");
    for (const seed of [...Array(16).keys()].map(x => x + 1)) {
        const option = document.createElement("option");
        option.text = String(seed);
        option.value = seed;
        seedSelect.add(option)
    }

    const teamSelect = document.getElementById("team");
    const sorted = dedupeAndSort(teams.map(t => t["team"]));
    for (const team of sorted) {
        if (!team) {
            continue;
        }
        const option = document.createElement("option");
        option.text = team;
        option.value = team;
        teamSelect.add(option)
    }
}

initialize();
