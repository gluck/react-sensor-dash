require('normalize.css/normalize.css');
require('styles/App.css');

import React from 'react';
import Rx from 'rxjs/Rx';
import Highcharts from 'highcharts';


const ReactHighcharts = require('react-highcharts');
window.Highcharts = Highcharts;
require('highcharts/themes/dark-unica')

Highcharts.setOptions({
	global: {
		useUTC: false
	}
});

class AppComponent extends React.Component {
  render() {
    return (
      <div className="index">
        <SensorChart channel_id={110113} api_key='XI17UCD9HC0A9H68' total={10000} average={10} unit='V' />
        <SensorChart channel_id={110112} api_key='4LGCNX1EUFQL51K0' total={10000} average={10} unit='V' />
        <SensorChart channel_id={109473} api_key='55XIB4H6YRRV5Y40' total={10000} median ={10} unit='°C' />
        <SensorChart channel_id={109473} api_key='55XIB4H6YRRV5Y40' total={10000} median ={10} field='2' unit='%' />
        <SensorChart channel_id={107110} api_key='7OR1QG7NTVDAQHGX' total={10000} average={10} unit='lx' />
        <SensorChart channel_id={108704} api_key='DGQN2E2Z6REHAT35' total={10000} average={10} field='3' unit='µg/m³' />
        <SensorChart channel_id={108704} api_key='DGQN2E2Z6REHAT35' total={10000} average={10} field='4' unit='µg/m³' />
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
      config: {}
    };
  }
  componentWillUnmount() {
    this.sub.unsubscribe();
  }
  computeLastURL() {
    if (this.props.average)
      return `https://thingspeak.com/channels/${this.props.channel_id}/feed/last_average.json?offset=0&average=${this.props.average}&results=${this.props.total}&api_key=${this.props.api_key}`;
    if (this.props.median)
      return `https://thingspeak.com/channels/${this.props.channel_id}/feed/last_median.json?offset=0&median=${this.props.median}&results=${this.props.total}&api_key=${this.props.api_key}`;
    return `https://thingspeak.com/channels/${this.props.channel_id}/feed/last.json?offset=0&results=${this.props.total}&api_key=${this.props.api_key}`;
  }
  computeDownloadURL() {
    if (this.props.average)
      return `https://thingspeak.com/channels/${this.props.channel_id}/field/${this.props.field}.json?average=${this.props.average}&offset=0&results=${this.props.total}&api_key=${this.props.api_key}`;
    if (this.props.median)
      return `https://thingspeak.com/channels/${this.props.channel_id}/field/${this.props.field}.json?median=${this.props.median}&offset=0&results=${this.props.total}&api_key=${this.props.api_key}`;
    return `https://thingspeak.com/channels/${this.props.channel_id}/field/${this.props.field}.json?offset=0&results=${this.props.total}&api_key=${this.props.api_key}`;
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
      return [ Date.parse(x.created_at), +parseFloat(val).toFixed(3)];
    return null;
  }
  getTitle(channel, x) {
    return {
      text: `${channel.name} - ${this.getValue(channel)} - ${x[1]} ${this.props.unit}`,
      align: 'center',
      verticalAlign: 'middle'
    };
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
          chart.setTitle(this.getTitle(this.state.channel, x));
        })
    );
    this.sub.add(Rx.Observable.from(fetch(this.computeDownloadURL()))
      .flatMap(r => r.json())
      .flatMap(res => Rx.Observable.from(res.feeds).map(this.getPoint.bind(this)).filter(x => x).toArray().map(data => ({res, data})))
      .subscribe(({res, data}) => {
        let channel = res.channel;
        this.setState({
          channel,
          config: {
            chart: {
              type: 'line',
              zoomType: 'x'
            },
            title: this.getTitle(channel, data[data.length-1]),
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
                text: this.getValue(channel)
              },
              min: null,
              max: null
            },
            legend: {
              enabled: false
            },
            series: [{
              data:  data,
              name: this.getValue(channel)
            }]
          }
        });
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
  field: '1'
};

AppComponent.defaultProps = {
};

export default AppComponent;
