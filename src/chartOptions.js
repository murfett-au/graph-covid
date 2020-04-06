export const chartOptionsFixed = {
    responsive: true,
    onResize: function(ci,newSize) {
        ci.options.legend.position = (newSize.width < 1200)?'bottom':'right';
    },
    tooltips: {
      mode: 'label'
    },
    elements: {
      line: {
        fill: false,
      }
    },
    legend:{
      position: 'bottom',
      onClick: function(e, legendItem) {
        var index = legendItem.datasetIndex;
        var ci = this.chart;
        var meta = ci.getDatasetMeta(index);
    
        // See controller.isDatasetVisible comment
        meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;
    
        // We hid a dataset ... rerender the chart
        ci.update();
    }
    },
    scales: {
      yAxes: [
        {
          id: 'doubling-days',
          scaleLabel: {
            display: true,
            labelString: 'Doubling Every... (days)',
          },
          type: 'linear',
          display: true,
          position: 'left',
          
          gridLines: {
            display: true
          },
          labels: {
            show: true,
          },
          ticks: {
              reverse: true,
              max: 10,
              min: 0,
              stepSize: 1
            },
        },
        {
          id: 'number',
          scaleLabel: {
            display: true,
            labelString: 'Deaths / Cases',
          },
          type: 'linear',
          display: true,
          position: 'right',
          
          gridLines: {
            display: false
          },

        }
      ]
    }
  };
export const chartOptionsNotFixed = {
    responsive: true,
    tooltips: {
      mode: 'label'
    },
    elements: {
      line: {
        fill: false
      }
    },
    scales: {
      
      yAxes: [
        {
          id: 'doubling-days',
          scaleLabel: {
            display: true,
            labelString: 'Deaths Double Every (days)',
          },
          type: 'linear',
          display: true,
          position: 'left',
          
          gridLines: {
            display: true
          },
          labels: {
            show: true
          },
          ticks:{ reverse: true }
        },
        {
          id: 'deaths',
          scaleLabel: {
            display: true,
            labelString: 'Deaths',
          },
          type: 'linear',
          display: true,
          position: 'right',
          
          gridLines: {
            display: false
          },

        }
      ]
    }
  };