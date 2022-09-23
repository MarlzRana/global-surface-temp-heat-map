const temperatureN5Color = "#4575b4";
const temperatureN4Color = "#4575b4";
const temperatureN3Color = "#74add1";
const temperatureN2Color = "#abd9e9";
const temperatureN1Color = "#e0f3f8";
const temperature0Color = "#ffffbf";
const temperature1Color = "#fee090";
const temperature2Color = "#fdae61";
const temperature3Color = "#f46d43";
const temperature4Color = "#d73027";
const temperature5Color = "#4575b4";

const temperatureSpectrum = [
  temperatureN5Color,
  temperatureN4Color,
  temperatureN3Color,
  temperatureN2Color,
  temperatureN1Color,
  temperature0Color,
  temperature1Color,
  temperature2Color,
  temperature3Color,
  temperature4Color,
  temperature5Color,
];

const fetchDataset = async (url) => {
  const response = await fetch(url);
  const jsonResponse = await response.json();
  return jsonResponse;
};

const monthNumberToName = (monthNumber) => {
  switch (monthNumber) {
    case 1:
      return "January";
    case 2:
      return "February";
    case 3:
      return "March";
    case 4:
      return "April";
    case 5:
      return "May";
    case 6:
      return "June";
    case 7:
      return "July";
    case 8:
      return "August";
    case 9:
      return "September";
    case 10:
      return "October";
    case 11:
      return "November";
    case 12:
      return "December";
    default:
      throw "An invalid month number was entered into f:monthNumberToName";
  }
};

const formatDataset = (dataset) => {
  const baseTemperature = dataset.baseTemperature;
  const varianceDataset = dataset.monthlyVariance.map((object) => ({
    ...object,
    temperature: object.variance + baseTemperature,
    monthName: monthNumberToName(object.month),
  }));
  return { baseTemperature, varianceDataset };
};

/* https://bl.ocks.org/mbostock/3019563 */
const applyMarginConvention = (svg, padding, margin) => {
  //Getting our svg dimension
  const outerWidth = svg.node().getBoundingClientRect().width;
  const outerHeight = svg.node().getBoundingClientRect().height;
  //Getting our inner svg dimension which define our max workable area (axis, axis labels and data)
  const innerWidth = outerWidth - margin.left - margin.right;
  const innerHeight = outerHeight - margin.top - margin.bottom;
  //Getting our "workable" svg dimension for data and where the axis edge (the axis labels will not be here)
  const width = innerWidth - padding.left - padding.right;
  const height = innerHeight - padding.top - padding.bottom;
  //Applying the translation to our svg to "automatically" handle the margin
  svg.attr("transform", `translate(${margin.left},${margin.top})`);
  return { outerWidth, outerHeight, innerWidth, innerHeight, width, height };
};

const plotXAxis = (svg, padding, height, id, xAxis) => {
  svg
    .append("g")
    .attr("id", id)
    .attr("transform", `translate(${padding.left}, ${height + padding.top})`)
    .call(xAxis);
};

const plotYAxis = (svg, padding, yAxis) => {
  svg
    .append("g")
    .attr("id", "y-axis")
    .attr("transform", `translate(${padding.left}, ${padding.top})`)
    .call(yAxis);
};

const temperatureToFillColor = (temperature, temperatureSpectrum) => {
  const heatmapColorSpectrumMapper = d3
    .scaleThreshold()
    .domain([2.8, 3.9, 5.0, 6.1, 7.2, 8.3, 9.4, 10.5, 11.6, 12.7])
    .range(temperatureSpectrum);
  return heatmapColorSpectrumMapper(temperature);
};

document.addEventListener("DOMContentLoaded", async () => {
  const unformattedDataset = await fetchDataset(
    "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json"
  );
  const { baseTemperature, varianceDataset } =
    formatDataset(unformattedDataset);
  //Replacing our heading
  document.getElementById("description").textContent = `${d3.min(
    varianceDataset,
    (d) => d.year
  )} - ${d3.max(
    varianceDataset,
    (d) => d.year
  )}: base temperature ${baseTemperature}℃`;
  //Getting our svg
  const svg = d3.select("#svg-graph");
  //Set-up margin
  const margin = { top: 0, right: 0, bottom: 0, left: 0 };
  const padding = { top: 0, right: 2, bottom: 20, left: 60 };
  const { outerWidth, outerHeight, innerWidth, innerHeight, width, height } =
    applyMarginConvention(svg, padding, margin);
  //Setting up the xScale and yScale
  const xScale = d3
    .scaleBand()
    .domain(varianceDataset.map((object) => object.year))
    .range([0, width]);
  const yScale = d3
    .scaleBand()
    .domain(Array.from({ length: 12 }, (value, index) => index + 1))
    .range([0, height]);
  //Create xAxis and yAxis
  const xAxis = d3
    .axisBottom()
    .scale(xScale)
    .tickValues(xScale.domain().filter((year) => year % 10 === 0));
  const yAxis = d3
    .axisLeft()
    .scale(yScale)
    .tickFormat((tickLabel) => monthNumberToName(tickLabel));
  //Plot xAxis and yAxis
  plotXAxis(svg, padding, height, "x-axis", xAxis);
  plotYAxis(svg, padding, yAxis);
  //Plot the data
  const graphPlot = svg
    .append("g")
    .attr("class", "graph-plot")
    .attr("transform", `translate(${padding.left}, ${padding.top})`);
  const entryWidth = xScale(2010) - xScale(2009);
  const entryHeight = yScale(2) - yScale(1);
  const plots = graphPlot
    .selectAll("rect")
    .data(varianceDataset)
    .enter()
    .append("rect")
    .attr("x", (d) => xScale(d.year))
    .attr("y", (d) => yScale(d.month))
    .attr("width", entryWidth)
    .attr("height", entryHeight)
    .attr("fill", (d) =>
      temperatureToFillColor(d.temperature, temperatureSpectrum)
    )
    .attr("class", "cell")
    .attr("data-month", (d) => d.month - 1)
    .attr("data-year", (d) => d.year)
    .attr("data-temp", (d) => d.temperature);

  //Creating the legend
  const legend = d3.select("#legend");
  //Setting up margin and padding for the legend svg
  const legendMargin = { top: 0, right: 0, bottom: 0, left: 0 };
  const legendPadding = { top: 0, right: 20, bottom: 20, left: 20 };
  //Applying margin and padding convention
  const { width: legendWidth, height: legendHeight } = applyMarginConvention(
    legend,
    legendPadding,
    legendMargin
  );
  //Create the legend scale
  const thresholdTemperatures = [
    2.8, 3.9, 5.0, 6.1, 7.2, 8.3, 9.4, 10.5, 11.6, 12.7,
  ];
  const legendScale = d3
    .scaleLinear()
    .domain(d3.extent(thresholdTemperatures))
    .range([0, legendWidth]);
  //Create legend axis
  const legendAxis = d3
    .axisBottom()
    .scale(legendScale)
    .tickValues(thresholdTemperatures)
    .tickFormat(d3.format(".1f"));
  //Plotting the legend axis
  plotXAxis(legend, legendPadding, legendHeight, "legend-axis", legendAxis);
  //Plotting our legend rect's
  //Create the plot
  const legendPlot = legend
    .append("g")
    .attr("class", "legend-plot")
    .attr(
      "transform",
      `translate(${legendPadding.left}, ${legendPadding.top})`
    );
  const legendRectHeight = 30;
  const legendRectWidth = legendScale(3.9) - legendScale(2.8);
  legendPlot
    .selectAll("rect")
    .data(thresholdTemperatures.slice(0, thresholdTemperatures.length - 1))
    .enter()
    .append("rect")
    .attr("x", (d) => legendScale(d))
    .attr("y", legendHeight - legendRectHeight)
    .attr("width", legendRectWidth)
    .attr("height", legendRectHeight)
    .attr("fill", (d) => temperatureToFillColor(d, temperatureSpectrum));

  const tooltip = d3
    .select(".graph-container")
    .append("div")
    .attr("id", "tooltip")
    .style("opacity", 0);
  //Creating our tooltip functions
  const mouseoverTooltip = (e) => {
    tooltip.transition().duration(150).style("opacity", 0.95);
    d3.select(e.srcElement).style("stroke", "black");
  };
  const mouseleaveTooltip = (e) => {
    tooltip.transition().duration(150).style("opacity", 0);
    d3.select(e.srcElement).style("stroke", "none");
  };

  const mousemoveTooltip = (e) => {
    const data = d3.select(e.srcElement).data()[0];
    tooltip.attr("data-year", data.year);
    tooltip.selectAll("p").remove();

    tooltip.append("p").text(`${data.year} - ${data.monthName}`);
    tooltip.append("p").text(`${data.temperature.toFixed(2)} ℃`);
    tooltip.append("p").text(`${data.variance.toFixed(2)} ℃`);

    tooltip
      .style("left", e.pageX + 15 + "px")
      .style("top", e.pageY - 30 + "px");
  };

  plots
    .on("mouseover", mouseoverTooltip)
    .on("mouseleave", mouseleaveTooltip)
    .on("mousemove", mousemoveTooltip);
});
