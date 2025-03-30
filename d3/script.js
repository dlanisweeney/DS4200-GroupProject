// Set dimensions and margins
const margin = { top: 20, right: 30, bottom: 50, left: 60 };
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Create SVG container
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Select tooltip div
const tooltip = d3.select("#tooltip");

// Load CSV data
d3.csv("age_sex_data.csv").then(data => {
    // Parse Age to numeric
    data.forEach(d => d.Age = +d.Age);

    // Group data by Sex and Age
    const groupedData = d3.rollups(
        data,
        v => v.length, // Count occurrences
        d => d.Age,    // Group by Age
        d => d.Sex     // Group by Sex
    );

    // Flatten grouped data
    const processedData = [];
    groupedData.forEach(([age, sexes]) => {
        const row = { Age: age };
        sexes.forEach(([sex, count]) => {
            row[sex] = count;
        });
        processedData.push(row);
    });

    // Stack data
    const keys = ["Male", "Female", "Unknown", "X"];
    const stack = d3.stack().keys(keys)(processedData);

    // Create scales
    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Age)])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(stack, layer => d3.max(layer, d => d[1]))])
        .range([height, 0]);

    const color = d3.scaleOrdinal()
        .domain(keys)
        .range(["blue", "pink", "gray", "gray"]);

    // Draw axes
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).ticks(10));
    svg.append("g")
        .call(d3.axisLeft(y));

    // Draw bars and add tooltips
    svg.selectAll("g.layer")
        .data(stack)
        .join("g")
        .attr("class", "layer")
        .attr("fill", d => color(d.key))
        .selectAll("rect")
        .data(d => d)
        .join("rect")
        .attr("x", d => x(d.data.Age))
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", x(1) - x(0) - 1) // Bar width
        .on("mouseover", (event, d) => {
            tooltip.style("visibility", "visible")
                   .text(`Age: ${d.data.Age}, Count: ${d[1] - d[0]}`);
        })
        .on("mousemove", (event, d) => {
            tooltip.style("top", (event.pageY - 10) + "px")
                   .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", () => {
            tooltip.style("visibility", "hidden");
        });
});
