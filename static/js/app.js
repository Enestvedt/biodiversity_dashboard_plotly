
// load the json data
d3.json("/data/samples.json")
  .then(start);

// "940" is the default id to load when the page loads - it is one of the selection options
function start(data){
    populateDropdown(data);
    createMetaData("940");
    createChart("940");
    gaugeChart("940");
    bubbleChart("940");
}

//get values drom data and create dropdown selector - this makes the selector dynamic - it data changes then page dropdown changes
function populateDropdown(data) {
  let dropElement = d3.select("#selDataset");
  data.names.forEach((dropVal) => {
      let option = dropElement.append("option");
      option.text(dropVal);
      option.attr("value", dropVal);
      }
  );
};


// handle selections in the id selector
// the onchange event calls this function from the html and sends
// the selected value to the function as the id parameter 
// <select id="selDataset" onchange="optionChanged(this.value)"></select>
function optionChanged(id){
  createMetaData(id);
  createChart(id);
  gaugeChart(id);
  bubbleChart(id);
}


// get selected id from optionchanged function and populate the panel with information about that selection
function createMetaData(id){
  d3.json("/data/samples.json")
    .then(function(data){

      let metadata = data.metadata;
      let person = metadata.filter(person => person.id === parseInt(id))[0];

      // add a div to the bootstrap panel - set text = to the key and value for the selected id
      let metadataList = d3.select("#sample-metadata");
      metadataList.html(""); // this removes existing li tags/contents
      Object.entries(person).forEach(([key, value]) => {
        metadataList.append("div").attr("class", "panel-body").text(`${key}:   ${value}`)}
      );
    }
  );
};

//takes the user selected id and creates a horizontal barchart 
function createChart(id){
  d3.json("/data/samples.json")
    .then(function(data){

      // get just the 'samples' array which is nested in 'data'
      let samples = data.samples;
      // filter the samples so that we see just the object that has the id pass in as a parameter, the select the array from the object
      let filteredSamples = samples.filter(sample => sample.id === id)[0];

      // sort the data from biggest to smallest and take the biggest 10
      let sampleVals = filteredSamples.sample_values.sort((a,b) => b-a).slice(0,10);
      
      // array to keep track of the indexes to match data after the sort
      let matchIndexes = [];

      // get the index where each sampleVal was found in the original data so we can get the matching data from other arrays
      // if the sample value shows up more than once, get the right index with a loop
      let indexesOf = (item, arr) => 
        arr.sample_values.reduce((acc, v, i) => (v === item && acc.push(i), acc),[]);
      
      // get the index for each val - it will return only the first index of that value
      // if there are duplicate values, then there will be is more than one occurrence,
      // later will have to return both indexes  - need this index so that I make sure not to add it twice in those cases
      sampleVals.forEach(function(val) {
        let my_index = filteredSamples.sample_values.indexOf(val);
        let indexCount = indexesOf(val, filteredSamples).length; //tells how many times that value shows up
        
        if (indexCount ===1) { // go ahead and push these since there is only one occurrence
          matchIndexes.push(my_index);

        } else if (matchIndexes.indexOf(my_index) == -1) { // these had more than 1 occurrence - check if they already were pushed
          let dupsIndexes = indexesOf(val, filteredSamples);
          dupsIndexes.forEach(x => matchIndexes.push(x)); //push all values if not there
        }
        //if they were already pushed, then do nothing
      }
      );

      
      // use the matchIndexes to gather corresponding data for the chart
      let otuIds = [];
      matchIndexes.forEach(i => otuIds.push(`OTU-ID ${filteredSamples.otu_ids[i]}`));

      let otuLabels = [];
      matchIndexes.forEach(i=> otuLabels.push(filteredSamples.otu_labels[i]));

      // create the chart
      var trace = {
        x: sampleVals.reverse(),
        y: otuIds.reverse(),
        name: "Top 10 OTUs",
        type: "bar",
        orientation: "h",
        text: otuLabels.reverse()
      }

      // data
      let chartData = [trace];

      // Apply the group bar mode to the layout
      let layout = {
        title: "10 Most-Populous OTUs",

      }

      // Render the plot to the div tag with id "plot"
      Plotly.newPlot("bar", chartData, layout);
    }
    );
}

//create a bubble chart for all of the OTU's showing their counts on the X axis and their count as the size of the bubble.  This also takes the user selected id as the paramter.
function bubbleChart(id){
  
  console.log("creating bubble chart");
  d3.json("/data/samples.json")
    .then(function(data){

      // get just the 'samples' array which is nested in 'data'
      let samples = data.samples;
      // filter the samples so that we see just the object that has the id pass in as a parameter, the select the array from the object
      let filteredSamples = samples.filter(sample => sample.id === id);
      let xvals =filteredSamples.map(object=>object.otu_ids)[0];
      let yvals =filteredSamples.map(object=>object.sample_values)[0];
      let hoverText = filteredSamples.map(object=>object.otu_labels)[0];
      
      let trace1 = {
        x: xvals,
        y: yvals,
        mode: 'markers',
        text: hoverText,
        marker: {
          size: yvals.map(y=>y/1.5),
          color: xvals
        }
      };
      
      let bubbleData = [trace1];
      
      let layout = {
        title: 'OTUs in Sample',
        showlegend: false,
        height: 420,
        width: 900,
        xaxis: {
          title: {
            text: 'OTU ID',
          },
        },
      };
      
      Plotly.newPlot('bubble', bubbleData, layout);

    }
  );
}


//take the user selected id and create a guage chart showing the number of washes per week
function gaugeChart(id){
  console.log("creating gauge chart");
  d3.json("/data/samples.json")
    .then(function(data){

      let metadata = data.metadata;
      let person = metadata.filter(person => person.id === parseInt(id))[0];
      let wfreq = person.wfreq;
      
      var gaugeData = [
        {
          domain: { x: [0, 1], y: [0, 1] },
          value: wfreq,
          title: { text: "Scrubs per Week" },
          type: "indicator",
          mode: "gauge+number",
          gauge: {
            axis: { range: [null, 9] },
            steps: [
              { range: [0, 1], color: 'rgba(255, 255, 255, 0)'},
              { range: [1, 2], color: 'rgba(247, 245, 230, .5)'},
              { range: [2, 3], color: 'rgba(240, 235, 212, .5)' },
              { range: [3, 4], color: 'rgba(232, 226, 202, .5)'},
              { range: [4, 5], color: 'rgba(210, 206, 145, .5)' },
              { range: [5, 6], color: 'rgba(202, 209, 95, .5)' },
              { range: [6, 7], color: 'rgba(170, 202, 42, .5)' },
              { range: [7, 8], color: 'rgba(110, 154, 22, .5)' },
              { range: [8, 9], color: 'rgba(14, 127, 0, .5)' }

            ]

          }
        }
      ];
      


      var layout = { width: 600, height: 500, margin: { t: 0, b: 0 } };
      Plotly.newPlot('gauge', gaugeData, layout);      

    }
  );  
}
