document.addEventListener("DOMContentLoaded", function () {
    // Set dimensions and margins (increased right margin for legend)
    const margin = { top: 40, right: 100, bottom: 70, left: 60 };
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
            .range(["#3498db", "#e74c3c", "#95a5a6", "#95a5a6"]); // Blue, Red, Gray, Gray

        // Draw axes with labels
        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x).ticks(10))
            .append("text")
            .attr("x", width / 2)
            .attr("y", 40)
            .attr("fill", "#000")
            .style("text-anchor", "middle")
            .text("Age (years)");

        svg.append("g")
            .call(d3.axisLeft(y))
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -40)
            .attr("x", -height / 2)
            .attr("fill", "#000")
            .style("text-anchor", "middle")
            .text("Number of Cases");

        // Add chart title
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text("Age Distribution of Overdose Cases by Sex");

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

        // Add legend
        const legend = svg.append("g")
            .attr("transform", `translate(${width + 20}, 20)`);

        keys.forEach((key, i) => {
            const legendItem = legend.append("g")
                .attr("transform", `translate(0, ${i * 25})`);

            legendItem.append("rect")
                .attr("width", 20)
                .attr("height", 20)
                .attr("fill", color(key));

            legendItem.append("text")
                .attr("x", 30)
                .attr("y", 15)
                .text(key === "X" ? "Other/Unknown" : key)
                .style("font-size", "12px");
        });

    }).catch(error=>console.error('Error loading CSV data:', error));
});    renderTimeTrendChart();
    renderDrugCountsChart();

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

function renderDrugCountsChart() {
    const margin = { top: 20, right: 30, bottom: 100, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;
    
    // Select the container and clear any existing content
    const container = d3.select("#drug-chart");
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
        .style("background", "rgba(0,0,0,0.7)")
        .style("color", "white")
        .style("padding", "8px")
        .style("border-radius", "4px")
        .style("font-size", "14px");

    // Sample data - replace this with your actual data loading
    const data = [
        { Drug: "Fentanyl", Count: 8500 },
        { Drug: "Heroin", Count: 6500 },
        { Drug: "Cocaine", Count: 4500 },
        { Drug: "Oxycodone", Count: 1800 },
        { Drug: "Methadone", Count: 1200 }
    ];

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
        .style("text-anchor", "end")
        .style("font-size", "12px");

    svg.append("g")
        .call(d3.axisLeft(y))
        .style("font-size", "12px");

    // Add y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Number of Cases");

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
        .attr("fill", "#e74c3c")
        .on("mouseover", function(event, d) {
            d3.select(this).attr("fill", "#c0392b");
            tooltip.style("visibility", "visible")
                .html(`<strong>${d.Drug}</strong><br>${d.Count.toLocaleString()} cases`);
        })
        .on("mousemove", function(event) {
            tooltip.style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function() {
            d3.select(this).attr("fill", "#e74c3c");
            tooltip.style("visibility", "hidden");
        });

    // Add title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
}

function renderTimeTrendChart() {
    const margin = { top: 30, right: 30, bottom: 70, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;
    
    // Select the container and clear any existing content
    const container = d3.select("#trend-chart");
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
        .style("background", "rgba(0,0,0,0.7)")
        .style("color", "white")
        .style("padding", "8px")
        .style("border-radius", "4px")
        .style("font-size", "14px");

    // Sample data - replace this with your actual data loading
    const data = [
        { Year: 2012, Cases: 650 },
        { Year: 2013, Cases: 720 },
        { Year: 2014, Cases: 780 },
        { Year: 2015, Cases: 820 },
        { Year: 2016, Cases: 1050 },
        { Year: 2017, Cases: 1350 },
        { Year: 2018, Cases: 1550 },
        { Year: 2019, Cases: 1750 },
        { Year: 2020, Cases: 2200 },
        { Year: 2021, Cases: 2500 },
        { Year: 2022, Cases: 2400 },
        { Year: 2023, Cases: 2300 }
    ];

    // Create scales
    const x = d3.scaleLinear()
        .domain([d3.min(data, d => d.Year), d3.max(data, d => d.Year)])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Cases) * 1.1])
        .range([height, 0]);

    // Add grid lines
    svg.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(y)
            .tickSize(-width)
            .tickFormat("")
        )
        .style("stroke", "#ddd")
        .style("stroke-opacity", 0.5);

    // Add axes
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).ticks(data.length).tickFormat(d3.format("d")))
        .style("font-size", "12px");

    svg.append("g")
        .call(d3.axisLeft(y))
        .style("font-size", "12px");

    // Add y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Number of Cases");

    // Create line generator
    const line = d3.line()
        .x(d => x(d.Year))
        .y(d => y(d.Cases))
        .curve(d3.curveMonotoneX);

    // Draw the line
    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#3498db")
        .attr("stroke-width", 3)
        .attr("d", line);

    // Add circles for each data point
    svg.selectAll(".dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", d => x(d.Year))
        .attr("cy", d => y(d.Cases))
        .attr("r", 6)
        .attr("fill", "#3498db")
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .on("mouseover", function(event, d) {
            d3.select(this).attr("fill", "#2980b9");
            tooltip.style("visibility", "visible")
                .html(`<strong>${d.Year}</strong><br>${d.Cases.toLocaleString()} cases`);
        })
        .on("mousemove", function(event) {
            tooltip.style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function() {
            d3.select(this).attr("fill", "#3498db");
            tooltip.style("visibility", "hidden");
        });

    // Add title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Connecticut Overdose Cases by Year");
}