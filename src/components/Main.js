require('normalize.css/normalize.css');
require('styles/App.css');

import React from 'react';
import Rx from 'rxjs/Rx';
import Highcharts from 'highcharts';


const ReactHighcharts = require('react-highcharts');
window.Highcharts = Highcharts;
require('highcharts/themes/dark-unica')
var moment = require('moment');

Highcharts.setOptions({
	global: {
		useUTC: false
	}
});

class AppComponent extends React.Component {
  render() {
    return (
      <div className="index">

        <SensorMultipleChart lines={[
          {channel_id:121133, api_key:'1508XIMXPKBOFZY2', average:10, unit:'ppm'}
          ]} />
        <SensorMultipleChart lines={[
          {channel_id:110112, api_key:'4LGCNX1EUFQL51K0', average:10, unit:'V', yAxis:1},
          {channel_id:116344, api_key:'5X4GM5DIHPOIKU43', average:10, unit:'V'},
          {channel_id:121447, api_key:'WTWRC4M0RJSP4CMB', average:10, unit:'V'}
          ]} />
        <SensorMultipleChart lines={[
          {channel_id:109473, api_key:'55XIB4H6YRRV5Y40', median:10, unit:'°C'},
          {channel_id:123479, api_key:'ZIZIYXS5HLRG1NSM', median:10, unit:'°C'},
          {channel_id:123706, api_key:'69IOUZWG8C0M6FDD', median:10, unit:'°C'},
          {channel_id:124108, api_key:'HMR5HK2ZVK3DX9JW', median:10, unit:'°C'},
          {channel_id:124198, api_key:'BT8NDK9IKWYSQBLS', median:10, unit:'°C'},
          {channel_id:107110, api_key:'7OR1QG7NTVDAQHGX', average:10, unit:'lx', yAxis:1}
          ]} />
        <SensorMultipleChart lines={[
          {channel_id:109473, api_key:'55XIB4H6YRRV5Y40', median:10, field:'2', unit:'%'},
          {channel_id:123479, api_key:'ZIZIYXS5HLRG1NSM', median:10, field:'2', unit:'%'},
          {channel_id:123706, api_key:'69IOUZWG8C0M6FDD', median:10, field:'2', unit:'%'},
          {channel_id:124108, api_key:'HMR5HK2ZVK3DX9JW', median:10, field:'2', unit:'%'},
          {channel_id:124198, api_key:'BT8NDK9IKWYSQBLS', median:10, field:'2', unit:'%'}
          ]} />
        <SensorMultipleChart lines={[
          {channel_id:116340, api_key:'G560Z466ZI4V386X', average:10, unit:'V'}
          ]} />
        <SensorMultipleChart lines={[
          {channel_id:116345, api_key:'OHB0H0GPATON7ZGS', average:10, unit:'V'}
          ]} />
        <SensorMultipleChart lines={[
          {channel_id:108704, api_key:'DGQN2E2Z6REHAT35', average:10, field:'3', unit:'µg/m³'},
          {channel_id:108704, api_key:'DGQN2E2Z6REHAT35', average:10, field:'4', unit:'µg/m³', yAxis:1}
          ]} />
        <SensorMultipleChart lines={[
          {channel_id:123479, api_key:'ZIZIYXS5HLRG1NSM', median:10, field:'4', unit:'bar'},
          {channel_id:123706, api_key:'69IOUZWG8C0M6FDD', median:10, field:'3', unit:'bar'},
          {channel_id:124108, api_key:'HMR5HK2ZVK3DX9JW', median:10, field:'3', unit:'bar'}
          ]} />
      </div>
    );
  }
}

class SensorMultipleChart extends React.Component {
  constructor(props) {
    super(props);
    this.lines = props.lines.map(line => Object.assign({ yAxis:0, field: 1, format: x => +x.toFixed(3)}, line));
    this.sub = new Rx.Subscription()
    this.channels = this.lines.map(() => ({}))
    this.state = {
      config: {
        credits: false,
        chart: {
          type: 'line',
          zoomType: 'x'
        },
        title: {
          text: 'Loading...',
          align: 'center',
          verticalAlign: 'middle'
        },
        plotOptions: {
          line: {
            color: '#d62020'
          },
          series: {
            marker: {
              radius: 3
            }
          }
        },
        xAxis: {
          type: 'datetime'
        },
        tooltip: {
          valueSuffix: this.props.unit ? ' '+this.props.unit : ''
        },
        yAxis: this.lines
          .filter((val, index, self) => self.findIndex(x => x.yAxis == val.yAxis) === index)
          .map(() => ({
            title: {
              text: ''
            },
            min: null,
            max: null
          })),
        legend: {
          //enabled: false
        },
        series: this.lines.map((line, index) => ({
          data:  [],
          yAxis: line.yAxis,
            color: this.index2color(index)
        }))
      }
    }
  }
  index2color(index) {
    switch(index) {
      case 0: return '#eee';
      case 1: return '#20d620';
      case 2: return '#2090ff';
      case 3: return '#FFCB46';
      default: return '#d62020';
    }
  }
  componentWillUnmount() {
    this.sub.unsubscribe();
  }
  computeLastURL(line) {
    if (line.average)
      return `https://thingspeak.com/channels/${line.channel_id}/feed/last_average.json?average=${line.average}&api_key=${line.api_key}`;
    if (line.median)
      return `https://thingspeak.com/channels/${line.channel_id}/feed/last_median.json?median=${line.median}&api_key=${line.api_key}`;
    return `https://thingspeak.com/channels/${line.channel_id}/feed/last.json?api_key=${line.api_key}`;
  }
  computeDownloadURL(line, r) {
    let end = r == 0 ? '&start='+moment().format('YYYYMMDD') : '&end='+moment().subtract(r-1, 'days').format('YYYYMMDD');
    if (line.average)
      return `https://thingspeak.com/channels/${line.channel_id}/field/${line.field}.json?average=${line.average}&offset=0&results=2880&api_key=${line.api_key}${end}`;
    if (line.median)
      return `https://thingspeak.com/channels/${line.channel_id}/field/${line.field}.json?median=${line.median}&offset=0&results=2880&api_key=${line.api_key}${end}`;
    return `https://thingspeak.com/channels/${line.channel_id}/field/${line.field}.json?offset=0&results=2880&api_key=${line.api_key}${end}`;
  }
  getUpdateInterval(line) {
    if (line.average)
      return line.average*60*1000;
    if (line.median)
      return line.median*60*1000;
    return 30*1000;
  }
  getValue(line, x) {
    return x['field'+line.field];
  }
  getPoint(line, x) {
    let val = this.getValue(line, x);
    if (val)
      return [ Date.parse(x.created_at), line.format(parseFloat(val))];
    return null;
  }
  refreshTitle() {
    let chart = this.refs.chart.getChart();
    chart.setTitle({
      text: Array.apply(null, {length: this.lines.length})
        .map(Number.call, Number)
        .filter(index => chart.series[index].data.length > 0)
        .map(index => `${this.channels[index].name} - ${this.getValue(this.lines[index], this.channels[index])} - ${chart.series[index].data[chart.series[index].data.length-1].y} ${this.lines[index].unit}`)
        .join('<br/>')
    });
  }
  updateChart(index, cb) {
    let chart = this.refs.chart.getChart();
    cb(chart, chart.series[index], chart.yAxis[this.lines[index].yAxis])
  }
  componentDidMount() {
    this.sub.add(
      Rx.Observable.range(0, this.lines.length)
        .flatMap(index => {
          let line = this.lines[index]
          return Rx.Observable.interval(this.getUpdateInterval(line))
            .flatMap(() => Rx.Observable.from(fetch(this.computeLastURL(line))))
            .flatMap(r => r.json())
            .map(x => this.getPoint(line, x))
            .filter(x => x)
            .map(x => {x, index})
        })
        .subscribe(({x, index}) => {
          this.updateChart(index, (chart, serie) => {
            if (serie.data[serie.data.length-1].x == x[0])
              serie.removePoint(serie.data.length-1, false);
            serie.addPoint(x, false);
            chart.redraw();
          });
          this.refreshTitle(index);
        })
    );
    this.sub.add(
      Rx.Observable.range(0, this.lines.length)
        .flatMap(index => {
          let line = this.lines[index]
          return Rx.Observable.interval(2000).take(7)
          .flatMap(r => {
            return Rx.Observable.from(fetch(this.computeDownloadURL(line, r)))
            .flatMap(r => r.json())
            .do(res => {
              if (this.channels[index].name) return;
              let channel = res.channel;
              this.channels[index] = channel;
              this.updateChart(index, (chart, serie, yAxis) => {
                let name = this.getValue(line, channel)
                serie.update({ name }, false);
                yAxis.setTitle({ text: name});
              });
            })
            .flatMap(res => res.feeds)
            .map(x => this.getPoint(line, x))
            .filter(x => x)
            .toArray()
            .map(data => ({data, index}));
        })
      })
      .subscribe(({data, index}) => {
        this.updateChart(index, (chart, serie) => {
          data.forEach(p => serie.addPoint(p, false));
          chart.redraw();
        });
        this.refreshTitle(index);
      })
    );
  }
  render() {
    return (
      <ReactHighcharts config={this.state.config} ref="chart"></ReactHighcharts>
    );
  }
}

AppComponent.defaultProps = {
};

export default AppComponent;
