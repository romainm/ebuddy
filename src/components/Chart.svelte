<script>
    import Chart from "chart.js";
    import { onMount, afterUpdate } from "svelte";

    export let data;
    export let width = 4;
    let ctx;
    let chart;
    const colourPos = "rgba(55, 200, 32, 1)";
    const colourNeg = "rgba(205, 50, 50, 1)";
    const colourNeutral = "#999999";

    onMount(() => {
        ctx = document.getElementById("chart");
    });
    afterUpdate(createChart);

    function createChart() {
        if (chart) chart.destroy();

        let colours = data.map(d =>
            d.value < 0 ? colourNeg : d.value === 0 ? colourNeutral : colourPos
        );
        let values = data.map(d => d.value);
        let lineColour = "#444444";
        let label = "Amount";
        if (values.every(v => v === 0)) {
        } else if (values.every(v => v <= 0)) {
            values = values.map(v => -v);
            lineColour = colourNeg;
            label = "Expense";
        }
        chart = new Chart(ctx, {
            type: "line",
            data: {
                labels: data.map(d => d.label),
                datasets: [
                    {
                        label: label,
                        data: values,

                        // linear lines
                        lineTension: 0,

                        // line
                        borderColor: lineColour,
                        borderWidth: 1,

                        // line filling
                        fill: false,
                        // backgroundColor: colours,

                        // points
                        pointBorderWidth: 0,
                        pointBackgroundColor: colours,
                        pointRadius: 5,
                    },
                ],
            },
            options: {},
        });
    }
</script>

<canvas id="chart" {width} height="1" />
