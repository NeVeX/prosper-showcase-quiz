$( document ).ready(function() {
    hideChart();
});

var color = Chart.helpers.color;

function hideChart() {
    $("#chart-div").hide();
}

function showChart() {
    $("#chart-div").show();
}

function showChartStatisticsForQuestion(statisticInformation, totalAnswers) {

    console.log("New chart data received");
    showChart();
    var i;
    var labelsToUse = [];
    var dataToUse = [];
    /**
     * There's more elegant ways of doing this - but feck it
     */
    for ( i = 1; i <= totalAnswers; i++) {
        labelsToUse.push(""+i);
        if ( i === 1) { dataToUse.push(statisticInformation.answerOne); }
        if ( i === 2) { dataToUse.push(statisticInformation.answerTwo); }
        if ( i === 3) { dataToUse.push(statisticInformation.answerThree); }
        if ( i === 4) { dataToUse.push(statisticInformation.answerFour); }
    }

    var horizontalBarChartData = {
        labels: labelsToUse,
        datasets: [{
            label: "",
            backgroundColor: color("rgb(255, 99, 132)").alpha(0.5).rgbString(),
            borderColor: "rgb(255, 99, 132)",
            borderWidth: 1,
            data: dataToUse
        }]
    };

    var ctx = document.getElementById("canvas").getContext("2d"); // use DOM directly - not JQUERY...
    window.myHorizontalBar = new Chart(ctx, {
        type: 'horizontalBar',
        data: horizontalBarChartData,
        options: {
            // Elements options apply to all of the options unless overridden in a dataset
            // In this case, we are setting the border of each horizontal bar to be 2px wide
            elements: {
                rectangle: {
                    borderWidth: 0
                }
            },
            scales: {
                xAxes: [{
                    gridLines: {
                        display: false
                    },
                    ticks: {
                        fontColor: "#ffffff",
                        fontSize: 10,
                        beginAtZero: true
                    }
                }],
                yAxes: [{
                    display: true,
                    gridLines: {
                        display: false
                    },
                    ticks: {
                        fontColor: "#ffffff",
                        fontSize: 10,
                        beginAtZero: true
                    }
                }]
            },
            // Responsive looks to be broken - https://github.com/jtblin/angular-chart.js/issues/84
            responsive: false,
            legend: {
                display: false,
                position: 'right'
            },
            title: {
                display: false
                // text: 'How people answered'
            }
        }
    });
}

