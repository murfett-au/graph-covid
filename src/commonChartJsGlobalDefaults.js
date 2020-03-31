/**
 * As chartJs is used to create charts in the document status reports (which uses Vue) and the document data reports (which uses React),
 * This file was extracted to allow it to be included in both without code duplication.
 * 
 * This will make it easier to maintain the same chartJs look across all reports.
 * 
 * Note this resource is useful to understand these options: https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/chart.js/index.d.ts
 */
export function setCommonChartJsGlobalDefaults(Chart) {
  Chart.defaults.global.maintainAspectRatio = false;
  Chart.defaults.global.defaultFontFamily = "'Roboto', 'Helvetica Neue', Helvetica, Arial, sans-serif";
  Chart.defaults.global.defaultFontSize = 14;
  Chart.defaults.global.defaultFontColor = "black";
  Chart.defaults.global.legend.labels.fontFamily = "'Roboto', 'Helvetica Neue', Helvetica, Arial, sans-serif";
  Chart.defaults.global.legend.labels.fontStyle = "bold";
  Chart.defaults.global.legend.labels.fontSize = 14;
  Chart.defaults.global.legend.labels.fontColor = "black";
}
