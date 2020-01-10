<script>
    import Chart from "../components/Chart.svelte";
    const ipc = require("electron").ipcRenderer;

    // data is: values + months / years, etc how many, which ones etc.
    // first report is net worth: sum of all transactions per account
    // starting from the initial date balance for each account.

    // second is per-category movements for the past n units (months/year)

    // third one is based on current selection of transactions in transactions page
    // this shows in-out by default. Default length = last 12 months.
    let data = [];
</script>

<Chart {data} />
