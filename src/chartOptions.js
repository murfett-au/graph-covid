export const chartOptionsFixed = {
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
          ticks: {
              reverse: true,
              max: 10,
              min: 0,
              stepSize: 1
            },
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