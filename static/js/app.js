
// load the json data
d3.json("/data/samples.json")
  .then(start);

// 
function start(data){
  // var sortedBySampleVal = data.sort((a, b) => b.samples.sample_values - a.samples.sample_values);
  // console.log("sorted data:  ", sortedBySampleVal);
  // // console.log(data);
    populateDropdown(data);
    createMetaData("940");
    createChart("940");
}

//get values drom data and create dropdown selector
function populateDropdown(data) {
  var dropElement = d3.select("#selDataset");
  data.names.forEach((dropVal) => {
      var option = dropElement.append("option");
      option.text(dropVal);
      option.attr("value", dropVal);
      }
  );
};


// handle changes in the id selector
// the onchange event calls this function from the html and sends
// the selected value to the function as the id parameter 
// <select id="selDataset" onchange="optionChanged(this.value)"></select>
function optionChanged(id){
  console.log("option changed");
  createMetaData(id);
  createChart(id);
}

// get selected id from optionchanged function and 
function createMetaData(id){
  d3.json("/data/samples.json")
    .then(function(data){

      metadata = data.metadata;
      person = metadata.filter(person => person.id === parseInt(id))[0];
      console.log("person: ", person);

      // add a div to the bootstrap panel - set text = to the key and value for the selected id
      var metadataList = d3.select("#sample-metadata");
      metadataList.html(""); // this removes existing li tags/contents
      Object.entries(person).forEach(([key, value]) => {
        metadataList.append("div").attr("class", "panel-body").text(`${key}:   ${value}`)}
      );
    }
  );
};


function createChart(id){
  console.log("creating chart");
  d3.json("/data/samples.json")
    .then(function(data){

      // get just the 'samples' array which is nested in 'data'
      var samples = data.samples;
      // filter the samples so that we see just the object that has the id pass in as a parameter, the select the array from the object
      var filteredSamples = samples.filter(sample => sample.id === id)[0];

      // sort the data from biggest to smallest and take the biggest 10
      var sampleVals = filteredSamples.sample_values.sort((a,b) => b-a).slice(0,10);
      
      // array to keep track of the indexes to match data after the sort
      var matchIndexes = [];

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
          var dupsIndexes = indexesOf(val, filteredSamples);
          dupsIndexes.forEach(x => matchIndexes.push(x)); //push all values if not there
        }
        //if they were already pushed, then do nothing
      }
      );

      
      // use the matchIndexes to gather corresponding data for the chart
      var otuIds = [];
      matchIndexes.forEach(i => otuIds.push(`OTU-ID ${filteredSamples.otu_ids[i]}`));
      console.log("otuIDs:  ", otuIds);

      var otuLabels = [];
      matchIndexes.forEach(i=> otuLabels.push(filteredSamples.otu_labels[i]));
      console.log("otuLabels: ",otuLabels);

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
      var chartData = [trace];

      // Apply the group bar mode to the layout
      var layout = {
        title: "Top Ten OTUs",

      }

      // Render the plot to the div tag with id "plot"
      Plotly.newPlot("plot", chartData, layout);
    }
    );
}