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
        <SensorChart channel_id={110113} api_key='XI17UCD9HC0A9H68' average={10} unit='ppm' format={v => +(2.697371312*Math.pow(v, -16.71115893)).toFixed(3)}/>
        <SensorChart channel_id={121133} api_key='1508XIMXPKBOFZY2' average={10} unit='ppm'/>
        <SensorChart channel_id={110112} api_key='4LGCNX1EUFQL51K0' average={10} unit='V'/>
        <SensorChart channel_id={116340} api_key='G560Z466ZI4V386X' average={10} unit='V'/>
        <SensorChart channel_id={116344} api_key='5X4GM5DIHPOIKU43' average={10} unit='V'/>
        <SensorChart channel_id={116345} api_key='OHB0H0GPATON7ZGS' average={10} unit='V'/>
        <SensorChart channel_id={121447} api_key='WTWRC4M0RJSP4CMB' average={10} unit='V'/>
        <SensorChart channel_id={121133} api_key='1508XIMXPKBOFZY2' average={10} field='2' unit='°'/>
        <SensorChart channel_id={109473} api_key='55XIB4H6YRRV5Y40' median ={10} unit='°C' />
        <SensorChart channel_id={109473} api_key='55XIB4H6YRRV5Y40' median ={10} field='2' unit='%' />
        <SensorChart channel_id={107110} api_key='7OR1QG7NTVDAQHGX' average={10} unit='lx' />
        <SensorChart channel_id={108704} api_key='DGQN2E2Z6REHAT35' average={10} field='3' unit='µg/m³' />
        <SensorChart channel_id={108704} api_key='DGQN2E2Z6REHAT35' average={10} field='4' unit='µg/m³' />
      </div>
    );
  }
}

class SensorChart extends React.Component {
  constructor(props) {
    super(props);
    this.sub = new Rx.Subscription();
    this.state = {
      channel: {},
      config: {
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
        yAxis: {
          title: {
            text: ''
          },
          min: null,
          max: null
        },
        legend: {
          enabled: false
        },
        series: [{
          data:  [],
          name: ''
        }]
      }
    };
  }
  componentWillUnmount() {
    this.sub.unsubscribe();
  }
  computeLastURL() {
    if (this.props.average)
      return `https://thingspeak.com/channels/${this.props.channel_id}/feed/last_average.json?average=${this.props.average}&api_key=${this.props.api_key}`;
    if (this.props.median)
      return `https://thingspeak.com/channels/${this.props.channel_id}/feed/last_median.json?median=${this.props.median}&api_key=${this.props.api_key}`;
    return `https://thingspeak.com/channels/${this.props.channel_id}/feed/last.json?api_key=${this.props.api_key}`;
  }
  computeDownloadURL(r) {
    let end = r == 0 ? '&start='+moment().format('YYYYMMDD') : '&end='+moment().subtract(r-1, 'days').format('YYYYMMDD');
    if (this.props.average)
      return `https://thingspeak.com/channels/${this.props.channel_id}/field/${this.props.field}.json?average=${this.props.average}&offset=0&results=2880&api_key=${this.props.api_key}${end}`;
    if (this.props.median)
      return `https://thingspeak.com/channels/${this.props.channel_id}/field/${this.props.field}.json?median=${this.props.median}&offset=0&results=2880&api_key=${this.props.api_key}${end}`;
    return `https://thingspeak.com/channels/${this.props.channel_id}/field/${this.props.field}.json?offset=0&results=2880&api_key=${this.props.api_key}${end}`;
  }
  getUpdateInterval() {
    if (this.props.average)
      return this.props.average*60*1000;
    if (this.props.median)
      return this.props.median*60*1000;
    return 30*1000;
  }
  getValue(x) {
    return x['field'+this.props.field];
  }
  getPoint(x) {
    let val = this.getValue(x);
    if (val)
      return [ Date.parse(x.created_at), this.props.format(parseFloat(val))];
    return null;
  }
  refreshTitle() {
    let chart = this.refs.chart.getChart();
    let series = chart.series[0];
    if (!series.data) return;
    chart.setTitle({
      text: `${this.state.channel.name} - ${this.getValue(this.state.channel)} - ${series.data[series.data.length-1].y} ${this.props.unit}`
    });
  }
  componentDidMount() {
    this.sub.add(
      Rx.Observable.interval(this.getUpdateInterval())
        .flatMap(() => Rx.Observable.from(fetch(this.computeLastURL())))
        .flatMap(r => r.json())
        .map(this.getPoint.bind(this))
        .filter(x => x)
        .subscribe(x => {
          let chart = this.refs.chart.getChart();
          let series = chart.series[0];
          if (series.data[series.data.length-1].x == x[0])
            series.removePoint(series.data.length-1, false);
          series.addPoint(x, false);
          chart.redraw();
          this.refreshTitle();
        })
    );
    this.sub.add(
      Rx.Observable.interval(2000).take(1)
      .flatMap(r => {
        return Rx.Observable.from(fetch(this.computeDownloadURL(r)))
        .flatMap(r => r.json())
        .do(res => {
          if (this.state.channel.name) return;
          let channel = res.channel;
          this.setState({ channel });
          let chart = this.refs.chart.getChart();
          chart.series[0].name = this.getValue(channel);
          chart.yAxis[0].setTitle({ text: this.getValue(channel)});
        })
        .flatMap(res => res.feeds)
        .map(this.getPoint.bind(this))
        .filter(x => x)
        .toArray();
      })
      .subscribe(data => {
        let chart = this.refs.chart.getChart();
        let series = chart.series[0];
        data.forEach(p => series.addPoint(p, false));
        chart.redraw();
        this.refreshTitle();
      })
    );
  }
  render() {
    return (
      <ReactHighcharts config={this.state.config} ref="chart"></ReactHighcharts>
    );
  }
}

SensorChart.defaultProps = {
  field: '1',
  format: x => +x.toFixed(3)
};

AppComponent.defaultProps = {
};

export default AppComponent;
