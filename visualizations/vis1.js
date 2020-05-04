function ramp(div, color, n = 256) {
  const canvas = div.append("canvas");
  const context = canvas.node().getContext("2d");
  for (let i = 0; i < n; ++i) {
    context.fillStyle = color(i / (n - 1));
    context.fillRect(i, 0, 10, 10);
  }
  return canvas.node();
}

function legend1({
  div,
  color,
  title,
  tickSize = 6,
  width = 250, 
  height = 100 + tickSize,
  marginTop = 0,
  marginRight = 0,
  marginBottom = -20 + tickSize,
  marginLeft = 0,
  ticks = width / 64,
  tickFormat,
  tickValues
} = {}) {
  const svg = div.append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .style("overflow", "visible")
      .style("display", "block");

  let tickAdjust = g => g.selectAll(".tick line").attr("y1", marginTop + marginBottom - height);
  let x;


 // Sequential
 if (color.interpolator) {
  x = Object.assign(color.copy()
      .interpolator(d3.interpolateRound(marginLeft, width - marginRight)),
      {range() { return [marginLeft, width - marginRight]; }});

  svg.append("image")
      .attr("x", marginLeft)
      .attr("y", marginTop)
      .attr("width", width - marginLeft - marginRight)
      .attr("height", height - marginTop - marginBottom)
      .attr("preserveAspectRatio", "none")
      .attr("xlink:href", ramp(div, color.interpolator()));

  // scaleSequentialQuantile doesn’t implement ticks or tickFormat.
  if (!x.ticks) {
    if (tickValues === undefined) {
      const n = Math.round(ticks + 1);
      tickValues = d3.range(n).map(i => d3.quantile(color.domain(), i / (n - 1)));
    }
    if (typeof tickFormat !== "function") {
      tickFormat = d3.format(tickFormat === undefined ? ",f" : tickFormat);
    }
  }
}


  svg.append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x)
        .ticks(ticks, typeof tickFormat === "string" ? tickFormat : undefined)
        .tickFormat(typeof tickFormat === "function" ? tickFormat : undefined)
        .tickSize(tickSize)
        .tickValues(tickValues))
      .call(g => g.select(".domain").remove())
      .call(g => g.append("text")
        .attr("x", marginLeft)
        .attr("y", marginTop + marginBottom - height - 6)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text(title));
}


function vis1(data, div) {

  var t1 = Array.from(d3.rollup(data, rec=>rec, d=>d.donor, d=>d.year),
    ([country, years, donor_amounts])=>{
      
      let recs_arr = Array.from(years, ([year, recs])=>{
          let x = d3.sum(d3.map(Array.from(recs), c=>c.commitment_amount_usd_constant).keys());
          return {
               year: year,
               donor_amount: x,
               }
      });
  
      return {
          country: country,
          years: recs_arr.map(c=>c.year),
          donor_amounts: recs_arr.map(c=>c.donor_amount),
      }
  });
  
  
  // Data of recipient countries
  
  var t2 = Array.from(d3.rollup(data, rec=>rec, d=>d.recipient, d=>d.year),
            ([country, years, rcpt_amounts])=>{
              
              let recs_arr = Array.from(years, ([year, recs])=>{
                  let x = d3.sum(d3.map(Array.from(recs), c=>c.commitment_amount_usd_constant).keys());
                  return {
                       year: year,
                       rcpt_amount: x,
                       }
              });
    
              return {
                  country: country,
                  years: recs_arr.map(c=>c.year),
                  rcpt_amounts: recs_arr.map(c=>c.rcpt_amount),
              }
  });
  
  // donor final data
  
  var donor_final_data = []
    var i;
    var j;
    for (i = 0; i < t1.length; i++) { 
      for (j=0; j< t1[i].years.length;j++){
        donor_final_data.push(
          {'country':t1[i].country,
           'year': (t1[i].years)[j],
           'amount': (t1[i].donor_amounts)[j]}
          );
      }
    }
  
  
  // recipient final data
  
  var rcpt_final_data = [];
    var k;
    var l;
    for (k = 0; k < t2.length; k++) { 
      for (l=0; l< t2[k].years.length;l++){
        rcpt_final_data.push(
          {'country':t2[k].country,
           'year': (t2[k].years)[l],
           'amount': -(t2[k].rcpt_amounts)[l]}
          );
      }
    }
  
  
  // Total data
  
  var total_data = Array.from(d3.rollup(donor_final_data.concat(rcpt_final_data), rec=>
                d3.sum(rec.map(r=>r.amount)) , d=>d.country, d=>d.year),
                          ([country, recs])=>{
            
              let temp = Array.from(recs, ([year, net_amount])=>({year, net_amount}));
              return {
                'country': country,
                'year': temp.map(c=>c.year),
                'net_amount': temp.map(c=>c.net_amount),
              }
  
  }).sort((a,b)=>d3.descending(d3.sum(a.net_amount), d3.sum(b.net_amount)));
  
  
  //Final data
  var final_data = [];
    var m;
    var n;
    for (m = 0; m < total_data.length; m++) { 
      for (n=0; n< total_data[m].year.length;n++){
        final_data.push(
          {'country':total_data[m].country,
           'year': (total_data[m].year)[n],
           'net_amount': ((total_data[m].net_amount)[n])/3000000}
          );
      }
    }
  final_data = final_data.sort((a,b)=> d3.descending(a.net_amount, b.net_amount))
  
  // All countries set
  var all_countries = Array.from(new Set(total_data.map(d => d.country))).sort((a,b) =>d3.ascending(a.net_, b.year));
  
  // All year set
  var all_year = Array.from(new Set(final_data.map(d => d.year))).sort(d3.ascending);
  
  
  
    const height = 500;
    const width = 1500;
  
    var margin = ({top: 40, right: 30, bottom: 30, left: 80})
  
    //color 
  
    var color2 = d3.scaleSequential(d3.extent(final_data, d => d.net_amount), d3.interpolateRdYlBu);
    legend1({
      div: div,
      color: color2,
      title: "Net Amount in Millions"
    });

    const x = d3.scaleBand()
        .range([0, width - margin.left])
        .domain(d3.map(all_year, d => d).keys())
        .paddingInner(0.1)
  
  
    const xAxis = d3.axisTop(x)
    
    const y = d3.scaleBand()
      .range([0, height - margin.top])
      .domain(all_countries.map(d => d))
      .padding(0.5)
    
    const yAxis = d3.axisLeft(y)
    
    
    
    const svg = div.append('svg')
        .attr('viewBox', `-${margin.left} -${margin.top} ${width} ${height}`)
  
    svg.append('g').call(yAxis)
  
    svg.append('g').call(xAxis).selectAll("text")
          .attr("y", 0)
          .attr("x", 1)
          .attr("dy", ".45em")
          .attr("dx", ".50em")
          .attr("transform", "rotate(270)")
        . attr("tickPadding", 6)
          .style("text-anchor", "start");
        
        // draw heatmap dots
    svg.append('g').selectAll('rect')
          .data(final_data)
          .join('rect')
            .attr('x', d => x(d.year))
            .attr('y', d => y(d.country))
            .attr('width',x.bandwidth())
            .attr('height', y.bandwidth())
            .attr('fill', d => color2(d.net_amount))
        
  
  
  
  
  
  }