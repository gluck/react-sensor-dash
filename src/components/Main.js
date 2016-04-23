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
        <SensorChart channel_id={110113} api_key='XI17UCD9HC0A9H68' total={7000} average={10} />
        <SensorChart channel_id={110112} api_key='4LGCNX1EUFQL51K0' total={7000} average={10} />
        <SensorChart channel_id={109473} api_key='55XIB4H6YRRV5Y40' total={7000} median={10} />
        <SensorChart channel_id={109473} api_key='55XIB4H6YRRV5Y40' total={7000} median={10} field='2'/>
        <SensorChart channel_id={107110} api_key='7OR1QG7NTVDAQHGX' total={7000} average={10}/>
        <SensorChart channel_id={108704} api_key='DGQN2E2Z6REHAT35' total={7000} average={10} field='3'/>
        <SensorChart channel_id={108704} api_key='DGQN2E2Z6REHAT35' total={7000} average={10} field='4'/>
      </div>
    );
  }
}

class SensorChart extends React.Component {
  constructor(props) {
    super(props);
    this.sub = new Rx.Subscription();
    this.state = {
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
  componentDidMount() {
    this.sub.add(
      Rx.Observable.interval(15000)
        .flatMap(() => Rx.Observable.from(fetch(this.computeLastURL())))
        .flatMap(r => r.json())
        .map(x => [ Date.parse(x.created_at), +parseFloat(x['field'+this.props.field]).toFixed(3)])
        .subscribe(x => {
          let chart = this.refs.chart.getChart();
          chart.series[0].addPoint(x, true, false);
        })
    );
    this.sub.add(Rx.Observable.from(fetch(this.computeDownloadURL()))
      .flatMap(r => r.json())
      .flatMap(res => Rx.Observable.from(res.feeds).filter(x => x['field'+this.props.field]).map(x => [ Date.parse(x.created_at), +parseFloat(x['field'+this.props.field]).toFixed(3)]).toArray().map(data => ({res, data})))
      .subscribe(({res, data}) => {
      this.setState({config: {
          chart: {
              type: 'line',
              zoomType: 'x'
            },
            title: {
              text: res.channel.name
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
            yAxis: {
              title: {
                text: res.channel['field'+this.props.field]
              },
              min: null ,
              max: null
            },
            legend: {
              enabled: false
            },
            series: [{
              data:  data,
              name: res.channel['field'+this.props.field]
            }]
          }
      });
    }));
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
