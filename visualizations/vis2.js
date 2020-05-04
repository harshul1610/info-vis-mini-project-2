function legend2(div, color) {
  const size = 10;
  const lineHeight = size * 1.5;

  const svg = div.append("svg");
  
  const rows = svg
    .selectAll("g")
    .data(color.domain())
    .join("g")
    .attr("transform", (d, i) => `translate(0, ${i * lineHeight})`);

  rows
    .append("rect")
    .attr("height", size)
    .attr("width", size)
    .attr("fill", d => color(d));

  rows
    .append("text")
    .attr("font-family", "sans-serif")
    .attr("font-size", 12)
    .attr("dominant-baseline", "hanging")
    .attr("x", lineHeight)
    .text(d => d);
}


function vis2(data, div) {

  for(var i=0;i<data.length;i++)
    {
      Object.keys(data[i]).forEach(function(key) {
      if(key != "date")
      {
        data[i][key] = parseInt(data[i][key])
      }else{
         data[i][key] = new Date(data[i][key])
      }
      });
    }


   var series = d3.stack()
   .keys(data.columns.slice(1))
   .offset(d3.stackOffsetExpand)(data);

   
  const margin = ({top: 10, right: 20, bottom: 20, left: 40});
  const width = 1000;
  const height = 200;

  var x = d3.scaleTime()
  .domain(d3.extent(data, d => d.date))
  .range([margin.left, width - margin.right])
  
  var y = d3.scaleLinear()
    .range([height - margin.bottom, margin.top])
  
  var xAxis = g => g
  .attr("transform", `translate(0,${height - margin.bottom})`)
  .call(d3.axisBottom(x).ticks(width / 40).tickSizeOuter(0));

  var yAxis = g => g
  .attr("transform", `translate(${margin.left},0)`)
  .call(d3.axisLeft(y).ticks(10, "%"))
  .call(g => g.select(".domain").remove());

  var area = d3.area()
  .x(d => x(d.data.date))
  .y0(d => y(d[0]))
  .y1(d => y(d[1]));
  
  var color = d3.scaleOrdinal()
    .domain(data.columns.slice(1))
    .range(d3.schemeSet3);
  
    legend2(div, color);

  const svg = div.append('svg')
      .attr("viewBox", [0, 0, width, height])
  
  
    svg.append("g")
      .selectAll("path")
      .data(series)
      .join("path")
      .attr("fill", ({key}) => color(key))
      .attr("d", area)
      .append("title")
      .text(({key}) => key);
  
    svg.append("g")
        .call(xAxis);
  
    svg.append("g")
        .call(yAxis);
}
