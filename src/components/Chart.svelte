<script>
    import Chart from "chart.js";
    import { onMount, afterUpdate } from "svelte";

    export let data;
    export let width = 4;
    let ctx;
    let chart;
    const colour2 = "rgba(105, 99, 232, 1)";

    onMount(() => {
        ctx = document.getElementById("chart");
    });
    afterUpdate(createChart);

    function createChart() {
        if (chart) chart.destroy();
        chart = new Chart(ctx, {
            type: "line",
            data: {
                labels: data.map(d => d.label),
                datasets: [
                    {
                        label: "Amount",
                        fill: false,
                        lineTension: 0,
                        data: data.map(d => d.value),
                        backgroundColor: [colour2],
                        borderColor: [colour2],
                        borderWidth: 2,
                        pointBorderWidth: 2,
                        pointBackgroundColor: colour2,
                    },
                ],
            },
            options: {},
        });
    }
</script>

<canvas id="chart" {width} height="1" />
