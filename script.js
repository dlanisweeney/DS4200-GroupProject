document.addEventListener("DOMContentLoaded", function () {
    // Set dimensions and margins
    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;
    
    // Select the container and append the chart div if missing
    const container = d3.select("#d3graph");
    let chartDiv = container.select("#chart");
    if (chartDiv.empty()) {
        chartDiv = container.append("div").attr("id", "chart");
    }

    // Create SVG container
    const svg = chartDiv.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Ensure tooltip exists
    let tooltip = d3.select("#tooltip");
    if (tooltip.empty()) {
     tooltip = d3.select("body").append("div")
        .attr("id", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "lightgray")
        .style("padding", "5px");
    }

    // Load CSV data
    d3.csv("age_sex_data.csv").then(data => {
        if (!data || data.length === 0) {
            console.error("CSV data is empty or failed to load.");
            return;
        }
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
            .on("mousemove", (event) => {
                tooltip.style("top", (event.pageY - 10) + "px")
                   .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", () => {
                tooltip.style("visibility", "hidden");
            });

        }).catch(error=>console.error('Error loading CSV data:', error));

    });

    
    // Load drug usage counts data
    d3.csv("drug_counts.csv").then(data => {
        const margin = { top: 20, right: 30, bottom: 50, left: 80 };
        const width = 800 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        data.forEach(d => {
            d.Count = +d.Count;
        });

        // Create scales
        const x = d3.scaleBand()
                    .domain(data.map(d => d.Drug))
                    .range([0, width])
                    .padding(0.2);

        const y = d3.scaleLinear()
                    .domain([0, d3.max(data, d => d.Count)])
                    .range([height, 0]);

        // Add axes
        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        svg.append("g")
            .call(d3.axisLeft(y));

        // Create bars
        svg.selectAll(".bar")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.Drug))
            .attr("y", d => y(d.Count))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d.Count))
            .attr("fill", "teal");

        // Add tooltips
        const tooltip = d3.select("body").append("div")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background", "lightgray")
            .style("padding", "5px")
            .style("border-radius", "5px")
            .style("border", "1px solid gray");

        svg.selectAll(".bar")
            .on("mouseover", (event, d) => {
                tooltip.style("visibility", "visible")
                    .text(`${d.Drug}: ${d.Count} cases`);
            })
            .on("mousemove", (event) => {
                tooltip.style("top", (event.pageY - 10) + "px")
                    .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", () => {
                tooltip.style("visibility", "hidden");
            });
    });
    renderTimeTrendChart();


function renderTimeTrendChart() {
    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;
    const container = d3.select("#trend");
    container.selectAll("*").remove();

    // Create SVG container
    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "lightgray")
        .style("padding", "5px");

    // Load and process data
    d3.csv("yearly_trends.csv").then(data => {
        if (!data || data.length === 0) {
            console.error("CSV data is empty or failed to load.");
            return;
        }
        data.forEach(d => {
            d.Year = +d.Year;
            d.Cases = +d.Cases;
        });
        const x = d3.scaleLinear()
            .domain([d3.min(data, d => d.Year), d3.max(data, d => d.Year)])
            .range([0, width]);
        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.Cases)])
            .range([height, 0]);

        // Draw axes
        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x).ticks(data.length));
        svg.append("g")
            .call(d3.axisLeft(y));

        // Draw line
        const line = d3.line()
            .x(d => x(d.Year))
            .y(d => y(d.Cases));

        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2)
            .attr("d", line);

        // Add points with tooltips
        svg.selectAll("circle")
            .data(data)
            .join("circle")
            .attr("cx", d => x(d.Year))
            .attr("cy", d => y(d.Cases))
            .attr("r", 5)
            .attr("fill", "steelblue")
            .on("mouseover", (event, d) => {
                tooltip.style("visibility", "visible")
                    .text(`Year: ${d.Year}, Cases: ${d.Cases}`);
            })
            .on("mousemove", (event) => {
                tooltip.style("top", (event.pageY - 10) + "px")
                    .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", () => {
                tooltip.style("visibility", "hidden");
            });

    }).catch(error => console.error('Error loading yearly trends data:', error));
}

// function renderDrugChart() {
//     const margin = { top: 20, right: 30, bottom: 100, left: 60 };
//     const width = 800 - margin.left - margin.right;
//     const height = 500 - margin.top - margin.bottom;
    
//     // Select the container and clear any existing content
//     const container = d3.select("#drug-chart");
//     container.selectAll("*").remove();

//     // Create SVG container
//     const svg = container.append("svg")
//         .attr("width", width + margin.left + margin.right)
//         .attr("height", height + margin.top + margin.bottom)
//         .append("g")
//         .attr("transform", `translate(${margin.left},${margin.top})`);

//     // Create tooltip
//     const tooltip = d3.select("body").append("div")
//         .attr("class", "tooltip")
//         .style("position", "absolute")
//         .style("visibility", "hidden")
//         .style("background", "lightgray")
//         .style("padding", "5px")
//         .style("border-radius", "5px");

//     // Load and process data
//     d3.csv("drug_counts.csv").then(data => {
//         if (!data || data.length === 0) {
//             console.error("CSV data is empty or failed to load.");
//             return;
//         }

//         // Process data
//         data.forEach(d => {
//             d.Count = +d.Count;
//         });

//         // Sort data by count (descending)
//         data.sort((a, b) => b.Count - a.Count);

//         // Create scales
//         const x = d3.scaleBand()
//             .domain(data.map(d => d.Drug))
//             .range([0, width])
//             .padding(0.2);

//         const y = d3.scaleLinear()
//             .domain([0, d3.max(data, d => d.Count)])
//             .range([height, 0]);

//         // Draw axes
//         svg.append("g")
//             .attr("transform", `translate(0, ${height})`)
//             .call(d3.axisBottom(x))
//             .selectAll("text")
//             .attr("transform", "rotate(-45)")
//             .style("text-anchor", "end")
//             .attr("dy", "0.5em");

//         svg.append("g")
//             .call(d3.axisLeft(y));

//         // Draw bars with tooltips
//         svg.selectAll(".bar")
//             .data(data)
//             .join("rect")
//             .attr("class", "bar")
//             .attr("x", d => x(d.Drug))
//             .attr("y", d => y(d.Count))
//             .attr("width", x.bandwidth())
//             .attr("height", d => height - y(d.Count))
//             .attr("fill", "steelblue")
//             .on("mouseover", (event, d) => {
//                 tooltip.style("visibility", "visible")
//                     .text(`${d.Drug}: ${d.Count} cases`);
//             })
//             .on("mousemove", (event) => {
//                 tooltip.style("top", (event.pageY - 10) + "px")
//                     .style("left", (event.pageX + 10) + "px");
//             })
//             .on("mouseout", () => {
//                 tooltip.style("visibility", "hidden");
//             });

//         // Add value labels
//         svg.selectAll(".label")
//             .data(data)
//             .join("text")
//             .attr("class", "label")
//             .attr("x", d => x(d.Drug) + x.bandwidth() / 2)
//             .attr("y", d => y(d.Count) - 5)
//             .attr("text-anchor", "middle")
//             .text(d => d.Count);

//     }).catch(error => console.error('Error loading drug counts data:', error));
// }