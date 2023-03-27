// Layout constants
let width = 1000;
let height = 200;
const MAX_WIDTH = 1000;

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
    return height / 7 * (1 - Math.log2(2 * finish) / Math.log2(2 * 2 * 64));
}

/** Returns a deduplicated and sorted version of a list. */
function dedupeAndSort(list) {
    const set = new Set(list);
    if (typeof set.values().next().value === "string") {
        return [...set.values()].sort();
    } else {
        return [...set.values()].sort((a, b) => a - b);
    }
}

function toxy(r, angle) {
    return {
        "x": height / 2 + r * Math.sin(Math.PI * 2 * angle / 360),
        "y": height / 2 + r * Math.cos(Math.PI * 2 * angle / 360)
    };
}

function arrangeCircle(teams, circle_r, r) {
    const h = height / 160;
    for (let i = 0; i < teams.length; i++) {
        teams[i] = {
            ...teams[i],
            ...toxy(circle_r * h, 360 * i / teams.length),
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
            const a = teams[0]["finish"] === "64" ? 0.4 : 1;
            return [
                ...arrangeCircle(teams.slice(0, 1), a * 0, radius),
                ...arrangeCircle(teams.slice(1), a * 30, radius),
            ];
        case 16:
            const b = teams[0]["finish"] === "64" ? 0.55 : 1;
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
    const locations = getLocations(teams);

    container.selectAll("circle")
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

    // Calculate width for chart
    width = Math.min(document.querySelector("#host").clientWidth, MAX_WIDTH);
    height = 50 + 100 * (width / MAX_WIDTH)

    // Draw svg
    const svg = d3
        .select("#host")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Season title
    svg.append("g").attr("class", "text").append("text")
        .attr("width", height)
        .attr("x", 20)
        .attr("y", height * 0.5)
        .attr("text-anchor", "middle")
        .attr("transform", `rotate(270,20,${height * 0.5})`)
        .text(year);

    // Get finishes
    const finishes = dedupeAndSort(subset.map(m => parseInt(m["finish"])));
    let x = 10;
    for (let i = 0; i < finishes.length; i++) {
        const finish = finishes[i];
        const finishTeams = subset.filter(m => m["finish"] === `${finish}`);
        drawPack(svg, x, 0, finishTeams);
        x += (i < 2 ? 0.8 : (i > 2 ? 1.2 : 1.1)) / 7.5 * (width - 20);
    }
}

let teams;

async function drawChart() {
    // Clear any past svg elements
    d3.select("#host").selectAll("*").remove();

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
    seedSelect.addEventListener("change", event => {
        if (event.target.value === "All") {
            seed = undefined;
        } else {
            seed = parseInt(event.target.value);
        }
        drawChart();
    });

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
    teamSelect.addEventListener("change", event => {
        if (event.target.value === "All") {
            team = undefined;
        } else {
            team = event.target.value;
        }
        drawChart();
    });

    //Resize the d3 charts on a page resize
    window.addEventListener("resize", () => {
        drawChart();
    });
}

initialize();
