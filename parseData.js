// created by Xiangyu on 05-07-1015
// function to parse data with JaveScript
statisticGraph = function(container, tableContainer) {
  // return Value
  var graph = {};
  this.peopleListSlice = {};
  this.itemVis = {};
  var _self = this;
  // reconstruct: 
  // this.itemVis :
  // {
  // status:controls whether show the rang or nor in the graph,
  // items:list all the items in the specfic range
  // }
  graph.getShowItem = function(itemObj) {
    var items = {};
    for (var item in itemObj) {
      _self.peopleListSlice[item] = {};
      items[item] = {
        'status': false,
        'items': {}
      };
      for (var k = 0; k < itemObj[item].length; k++) {
        _self.peopleListSlice[item][itemObj[item][k].name] = [];
        items[item].items[itemObj[item][k].name] = false;
      }
    }
    _self.itemVis = items;
  };
  // when select an item, control if it will be shown or not
  graph.changeShowItem = function(range, item, status) {
    _self.itemVis[range].items[item] = status;
  };
  // change a specific domain of statistic data for visualization
  graph.changeShowRange = function(range, status) {
    _self.itemVis[range].status = status;
    for (var k in _self.itemVis[range].items) {
      _self.itemVis[range].items[k] = status;
    }
    return this;
  };
  // according selected data range, slice data according people for visualization
  // this.peopleListSlice :{functions:[{}{}...],areas:.....}
  graph.classifyData = function(data) {
    for (var i = 0; i < data.length; i++) {
      for (var range in _self.peopleListSlice) {
        var type = range.substring(0, range.length - 1);
        for (var k = 0; k < data[i][type].length; k++) {
          _self.peopleListSlice[range][data[i][type][k].name].push(data[i]);
        }
      }
    }
  };
  // reconstruct graph drawing manipulation
  graph.refreashGraph = function() {
    var numCount = {},
      label = [],
      num = [],
      showData = {},
      rangeList = [];
    for (var range in _self.itemVis) {
      if (_self.itemVis[range].status) {
        rangeList.push(range);
      }
    }
    clearGraph();
    if (!rangeList.length) {
      return this;
    }
    var dataShow = showGraphWithDimension(rangeList);
    this.showHighCharts("bar", dataShow.label, dataShow.num);
    this.drawTable(dataShow.dataset, tableContainer);
    return this;
  };
  var clearGraph = function() {
    d3.select(container).select(".highcharts-container").remove();
    d3.select(tableContainer).select('table').remove();
  };
  var showGraphWithDimension = function(rangeList) {
    if (rangeList.length == 1)
      return oneDimensionDraw(rangeList[0]);
    else
      return twoDimensionDraw(rangeList);
  };
  var oneDimensionDraw = function(range) {
    var numCount = {},
      label = [],
      index = [range],
      num = [],
      showData = {};
    for (var item in _self.peopleListSlice[range]) {
      numCount[item] = _self.peopleListSlice[range][item].length;
    }
    for (var i in numCount) {
      index.push(i);
      label.push(i);
      num.push(numCount[i]);
    }
    showData['label'] = label;
    showData['num'] = [{
      'name': "People",
      'data': num
    }];
    numCount[range] = 'Number';
    showData['dataset'] = {
      'index': index,
      'data': [numCount]
    };
    return showData;
  };
  var twoDimensionDraw = function(rangeList) {
    var numCount = {},
      label = [],
      dataShow = [],
      tableDataSet = {
        'index': [rangeList[1]],
        'data': []
      },
      visData = {};
    for (var domain in _self.peopleListSlice[rangeList[1]]) {
      var dataList = countData(rangeList[0], domain, _self.peopleListSlice[rangeList[1]][domain]);
      dataShow.push(dataList);
      dataList.tableData[rangeList[1]] = domain;
      tableDataSet.data.push(dataList.tableData);
    }
    for (var i in _self.peopleListSlice[rangeList[0]]) {
      label.push(i);
      tableDataSet.index.push(i);
    }
    visData['label'] = label;
    visData['num'] = dataShow;
    visData['dataset'] = tableDataSet;
    return visData;
  };
  var countData = function(range, domain, data) {
    var numCount = {},
      label = [],
      num = [],
      showData = {};
    for (var item in _self.peopleListSlice[range]) {
      numCount[item] = 0;
    }
    var type = range.substring(0, range.length - 1);
    for (var i = 0; i < data.length; i++) {
      for (var k = 0; k < data[i][type].length; k++) {
        var name = data[i][type][k].name;
        if (numCount[name] !== undefined)
          numCount[name] += 1;
      }
    }
    for (var i in numCount) {
      num.push(numCount[i]);
    }
    showData['name'] = domain;
    showData['data'] = num;
    showData['tableData'] = numCount;
    return showData;
  };
  // created by Xiangyu on 05-12-2015
  // dynaic binding table using d3.js
  var tabulate = function(data, columns, container) {
    var table = d3.select(container).append("table"),
      thead = table.append("thead"),
      tbody = table.append("tbody");
    // append the header row
    thead.append("tr")
      .selectAll("th")
      .data(columns)
      .enter()
      .append("th")
      .text(function(column) {
        return column;
      });
    // create a row for each object in the data
    var rows = tbody.selectAll("tr")
      .data(data)
      .enter()
      .append("tr");
    // create a cell in each row for each column
    var cells = rows.selectAll("td")
      .data(function(row) {
        return columns.map(function(column) {
          return {
            column: column,
            value: row[column]
          };
        });
      })
      .enter()
      .append("td")
      .text(function(d) {
        return d.value;
      });
    return table;
  };
  graph.drawTable = function(dataset, container) {
    // create and render the table
    var table = tabulate(dataset.data, dataset.index, container);
    // uppercase the first letter of column headers
    table.selectAll("thead th")
      .text(function(column) {
        return column.charAt(0).toUpperCase() + column.substr(1);
      });
  };
  graph.showHighCharts = function(graphType, showLabel, showData) {
    $(container).highcharts({
      chart: {
        type: 'column'
      },
      title: {
        text: '人员分布'
      },
      subtitle: {
        text: 'wandoulabs'
      },
      xAxis: {
        categories: showLabel,
        title: {
          text: null
        },
        crosshair: true
      },
      yAxis: {
        min: 0,
        title: {
          text: 'Population ',
          align: 'high'
        },
        labels: {
          overflow: 'justify'
        }
      },
      tooltip: {
        headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
        pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
          '<td style="padding:0"><b>{point.y:.1f} </b></td></tr>',
        footerFormat: '</table>',
        shared: true,
        useHTML: true
      },
      plotOptions: {
        column: {
          pointPadding: 0.2,
          borderWidth: 0
        }
      },
      legend: {
        layout: 'horizontal',
        align: 'right',
        verticalAlign: 'top',
        x: -40,
        y: 100,
        floating: true,
        borderWidth: 1,
        backgroundColor: ((Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'),
        shadow: true
      },
      credits: {
        enabled: false
      },
      series: showData
    });
  };
  return graph;
};


// parse data to specify data visualization range when loading and choose
parse = function(data, status, type) {
  var onWork = [],
    away = [],
    intern = [],
    fullTime = [];
  for (var i = 0; i < data.length; i++) {
    if (data[i].status == "在职") {
      onWork.push(data[i]);
    }
    if (data[i].status == "离职") {
      away.push(data[i]);
    }
    if (data[i].nature == "全职") {
      fullTime.push(data[i]);
    } else if (data[i].nature && data[i].nature.match("实习")) {
      intern.push(data[i]);
    }
  }
  var peopleList = {};
  peopleList['onWork'] = onWork;
  peopleList['away'] = away;
  peopleList['fullTime'] = fullTime;
  peopleList['intern'] = intern;
  return peopleList;
};
